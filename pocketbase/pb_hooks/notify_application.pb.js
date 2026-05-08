onRecordAfterUpdateSuccess((e) => {
    console.log("===> [HOOK] Memulai notifikasi status lamaran...");
    try {
        const currentStatus = e.record.get("status");
        
        // Fetch relations to construct email context
        const alumniId = e.record.get("alumni");
        const jobId = e.record.get("job");
        const companyId = e.record.get("company");

        const alumni = $app.findRecordById("alumni", alumniId);
        const job = $app.findRecordById("job_postings", jobId);
        const company = $app.findRecordById("companies", companyId);

        const email = alumni.get("email");
        
        if (email) {
            const message = new MailerMessage({
                from: {
                    address: $app.settings().meta.senderAddress,
                    name:    $app.settings().meta.senderName || "Sistem Informasi Alumni",
                },
                to:      [{address: email}],
                subject: `Update Status Lamaran: ${job.get("posisi")}`,
                html:    `
                    <div style="font-family: system-ui, sans-serif; padding: 20px; color: #334155; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px;">
                        <h2 style="color: #0f172a;">Halo ${alumni.get("nama")},</h2>
                        <p>Status lamaran Anda untuk posisi <b>${job.get("posisi")}</b> di <b>${company.get("nama")}</b> telah diperbarui oleh pihak perusahaan.</p>
                        
                        <div style="background-color: #f8fafc; padding: 16px; border-left: 4px solid #3b82f6; border-radius: 4px; margin: 20px 0;">
                            <p style="margin: 0; font-size: 16px;">Status lamaran Anda saat ini adalah: <strong style="color: #2563eb;">${currentStatus}</strong></p>
                        </div>

                        <p>Silakan login ke portal Sistem Informasi Alumni untuk melihat detail lebih lanjut atau mengecek instruksi dari pihak perusahaan.</p>
                        <br/>
                        <p style="margin-bottom: 0;">Salam hangat,</p>
                        <p style="margin-top: 5px; font-weight: bold; color: #0f172a;">Tim Pusat Karir & Alumni</p>
                    </div>
                `,
            });

            $app.newMailClient().send(message);
            console.log("Notifikasi email berhasil dikirim ke: " + email);
        }
    } catch (err) {
        console.error("Gagal mengirim email notifikasi status lamaran: ", err);
    }
}, "applications");
