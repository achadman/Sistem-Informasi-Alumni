onRecordAfterUpdateSuccess((e) => {
    console.log("===> [HOOK] Memulai notifikasi verifikasi perusahaan...");
    try {
        const isVerified = e.record.get("verified");
        
        // Kita hanya ingin mengirim email jika statusnya diverifikasi
        // Idealnya kita cek e.record.originalCopy().get("verified") !== true
        // Tapi sebagai fallback, jika "verified" = true, kita kirim email.
        
        if (isVerified) {
            const email = e.record.get("email");
            const companyName = e.record.get("nama");
            
            if (email) {
                const message = new MailerMessage({
                    from: {
                        address: $app.settings().meta.senderAddress,
                        name:    $app.settings().meta.senderName || "Sistem Informasi Alumni",
                    },
                    to:      [{address: email}],
                    subject: `Akun Perusahaan Anda Telah Diverifikasi`,
                    html:    `
                        <div style="font-family: system-ui, sans-serif; padding: 20px; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                            <h2 style="color: #0f172a;">Halo Tim ${companyName},</h2>
                            <p>Selamat! Akun perusahaan Anda di portal <b>Sistem Informasi Alumni</b> telah berhasil diverifikasi oleh Admin.</p>
                            
                            <div style="background-color: #f0fdf4; padding: 16px; border-left: 4px solid #22c55e; border-radius: 4px; margin: 20px 0;">
                                <p style="margin: 0; font-size: 16px;">Anda sekarang dapat memposting lowongan pekerjaan dan mencari kandidat alumni terbaik kami.</p>
                            </div>

                            <p>Silakan login ke dashboard Anda untuk mulai menggunakan layanan kami.</p>
                            <br/>
                            <p style="margin-bottom: 0;">Salam hangat,</p>
                            <p style="margin-top: 5px; font-weight: bold; color: #0f172a;">Tim Pusat Karir & Admin</p>
                        </div>
                    `,
                });

                $app.newMailClient().send(message);
                console.log("Notifikasi verifikasi berhasil dikirim ke: " + email);
            }
        }
    } catch (err) {
        console.error("Gagal mengirim email verifikasi perusahaan: ", err);
    }
}, "companies");
