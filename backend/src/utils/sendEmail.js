import nodemailer from 'nodemailer';
import PDFDocument from 'pdfkit';

// ─── Transporter réutilisable ───────────────────────────────────────────────
const createTransporter = () =>
  nodemailer.createTransport({
    host:   process.env.EMAIL_HOST,
    port:   Number(process.env.EMAIL_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

// ─── Fonction générique (déjà utilisée dans auth) ──────────────────────────
export default async function sendEmail({ to, subject, html }) {
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"DonationConnect" <${process.env.EMAIL_USER}>`,
    to,
    subject,
    html,
  });
}

// ─── Fonction spécifique : reçu de donation ────────────────────────────────
export async function sendReceiptEmail(donation) {
  // 1. Générer le PDF en mémoire
  const pdfBuffer = await generateReceiptPDF(donation);

  // 2. Envoyer avec pièce jointe
  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"DonationConnect" <${process.env.EMAIL_USER}>`,
    to:   donation.donor.email,
    subject: `Reçu de votre don — ${donation.campaign.title}`,
    html: `
      <div style="font-family:sans-serif;max-width:560px;margin:auto">
        <h2 style="color:#0F6E56">Merci pour votre don !</h2>
        <p>Bonjour <strong>${donation.donor.name}</strong>,</p>
        <p>Votre don de <strong>${donation.amount} €</strong> 
           pour la campagne <strong>${donation.campaign.title}</strong> 
           a bien été reçu.</p>
        <p style="color:#888;font-size:13px">
          Référence : ${donation.stripePaymentIntentId}
        </p>
        <p>Votre reçu PDF est joint à cet email.</p>
      </div>
    `,
    attachments: [
      {
        filename: `recu-donation-${donation._id}.pdf`,
        content:  pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

// ─── Générateur PDF interne ────────────────────────────────────────────────
function generateReceiptPDF(donation) {
  return new Promise((resolve, reject) => {
    const doc     = new PDFDocument({ margin: 50 });
    const buffers = [];

    doc.on('data', chunk => buffers.push(chunk));
    doc.on('end',  ()    => resolve(Buffer.concat(buffers)));
    doc.on('error', reject);

    // En-tête
    doc.fontSize(22).fillColor('#0F6E56').text('DonationConnect', { align: 'center' });
    doc.fontSize(14).fillColor('#444').text('Reçu de donation', { align: 'center' });
    doc.moveDown();

    // Ligne séparatrice
    doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#ddd').stroke();
    doc.moveDown();

    // Infos
    const date = new Date(donation.createdAt).toLocaleDateString('fr-FR', {
      day: '2-digit', month: 'long', year: 'numeric',
    });

    const rows = [
      ['Donateur',   donation.donor.name],
      ['Email',      donation.donor.email],
      ['Campagne',   donation.campaign.title],
      ['Montant',    `${donation.amount} €`],
      ['Date',       date],
      ['Référence',  donation.stripePaymentIntentId],
      ['Statut',     'Paiement confirmé'],
    ];

    doc.fontSize(12).fillColor('#333');
    rows.forEach(([label, value]) => {
      doc.font('Helvetica-Bold').text(`${label} :`, { continued: true });
      doc.font('Helvetica').text(`  ${value}`);
      doc.moveDown(0.4);
    });

    doc.moveDown();
    doc.fontSize(10).fillColor('#aaa')
       .text('Ce reçu est généré automatiquement par DonationConnect.', { align: 'center' });

    doc.end();
  });
}