import { createClient } from 'npm:@supabase/supabase-js@2.57.4';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

function generateCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function emailFromPhone(phone: string): string {
  return `${phone.replace(/[^0-9]/g, '')}@wholesale.local`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const body = await req.json();
    const action = body.action;

    // ============ SEND OTP ============
    if (action === "send") {
      const phone: string = body.phone;
      if (!phone) {
        return new Response(JSON.stringify({ error: "رقم الهاتف مطلوب" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete old unused codes for this phone
      await adminClient.from("otp_codes").delete().eq("phone", phone).eq("used", false);

      const code = generateCode();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

      const { error: insertError } = await adminClient.from("otp_codes").insert({
        phone,
        code,
        expires_at: expiresAt.toISOString(),
      });

      if (insertError) {
        return new Response(JSON.stringify({ error: "فشل حفظ الرمز" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // In production: send SMS here via a provider.
      // For this environment, return the code so the UI can display it.
      return new Response(JSON.stringify({ success: true, code }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ============ VERIFY OTP ============
    if (action === "verify") {
      const phone: string = body.phone;
      const code: string = body.code;
      if (!phone || !code) {
        return new Response(JSON.stringify({ error: "البيانات ناقصة" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Find the latest valid code
      const { data: otpRecord, error: otpError } = await adminClient
        .from("otp_codes")
        .select("*")
        .eq("phone", phone)
        .eq("code", code)
        .eq("used", false)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (otpError || !otpRecord) {
        return new Response(JSON.stringify({ error: "رمز التحقق غير صحيح" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (new Date(otpRecord.expires_at) < new Date()) {
        return new Response(JSON.stringify({ error: "انتهت صلاحية الرمز" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Mark as used
      await adminClient.from("otp_codes").update({ used: true }).eq("id", otpRecord.id);

      const email = emailFromPhone(phone);

      // Check if we already have an auth account for this phone
      const { data: existingLink } = await adminClient
        .from("phone_auth")
        .select("email, password")
        .eq("phone", phone)
        .maybeSingle();

      const authEmail = email;
      let authPassword: string;

      if (existingLink) {
        authPassword = existingLink.password;
      } else {
        // Generate a random password and create a new auth user
        authPassword = crypto.randomUUID();
        const { error: signUpError } = await adminClient.auth.admin.createUser({
          email,
          password: authPassword,
          email_confirm: true,
        });

        if (signUpError) {
          return new Response(JSON.stringify({ error: "فشل إنشاء الحساب" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        const { error: linkError } = await adminClient.from("phone_auth").insert({
          phone,
          email,
          password: authPassword,
        });

        if (linkError) {
          return new Response(JSON.stringify({ error: "فشل ربط الحساب" }), {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }
      }

      // Return credentials so the client can sign in
      return new Response(
        JSON.stringify({ success: true, email: authEmail, password: authPassword }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(JSON.stringify({ error: "إجراء غير معروف" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "خطأ غير متوقع" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
