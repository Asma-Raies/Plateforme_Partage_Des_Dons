import { useEffect, useState } from "react";
import axios from "../../api/axios.js";
import { jsPDF } from "jspdf";

export default function DonationHistory() {
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    axios.get("/donations/history")
      .then((res) => setDonations(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const downloadReceipt = (donation) => {
    setDownloadingId(donation._id);
    try {
      const doc = new jsPDF({ unit: "pt", format: "a4" });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();

      const TEAL   = [15, 110, 86];
      const TEAL_L = [230, 244, 241];
      const WHITE  = [255, 255, 255];
      const SLATE  = [30, 41, 59];
      const MUTED  = [100, 116, 139];
      const BORDER = [226, 232, 240];

      const dateLabel = new Date(donation.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit", month: "long", year: "numeric",
      });
      const ref = donation.stripePaymentIntentId || `DON-${donation._id}`;

      // ── Header band ──────────────────────────────────────
      doc.setFillColor(...TEAL);
      doc.rect(0, 0, W, 110, "F");

      doc.setFont("helvetica", "bold");
      doc.setFontSize(22);
      doc.setTextColor(...WHITE);
      doc.text("DonationConnect", 50, 44);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.text("Official Donation Receipt", 50, 64);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`REF: ${ref}`, W - 50, 42, { align: "right" });
      doc.setFont("helvetica", "normal");
      doc.setTextColor(200, 240, 230);
      doc.text(dateLabel, W - 50, 58, { align: "right" });

      // ── Thank-you strip ──────────────────────────────────
      doc.setFillColor(...TEAL_L);
      doc.rect(0, 110, W, 48, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(11);
      doc.setTextColor(...TEAL);
      const donorName = donation.donor?.name || "Donor";
      doc.text(
        `Thank you, ${donorName} — your generosity makes a difference.`,
        W / 2, 140, { align: "center" }
      );

      // ── White card ───────────────────────────────────────
      const cX = 40, cY = 178, cW = W - 80, cH = 310;
      doc.setFillColor(...WHITE);
      doc.roundedRect(cX, cY, cW, cH, 8, 8, "F");
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.5);
      doc.roundedRect(cX, cY, cW, cH, 8, 8, "S");

      // Card section title
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...MUTED);
      doc.text("DONATION DETAILS", cX + 24, cY + 26);
      doc.setDrawColor(...BORDER);
      doc.line(cX + 24, cY + 34, cX + cW - 24, cY + 34);

      // Rows
      const rows = [
        ["Donor Name",     donation.donor?.name  || "—"],
        ["Email",          donation.donor?.email || "—"],
        ["Campaign",       donation.campaign?.title || "—"],
        ["Amount",         `${(donation.amount || 0).toLocaleString()} TND`],
        ["Payment Date",   dateLabel],
        ["Payment Method", "Credit / Debit Card (Stripe)"],
        ["Status",         "Confirmed ✓"],
        ["Transaction Ref",ref],
      ];

      let y = cY + 50;
      rows.forEach(([label, value], i) => {
        if (i % 2 === 0) {
          doc.setFillColor(248, 250, 252);
          doc.rect(cX + 1, y - 8, cW - 2, 26, "F");
        }
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text(label.toUpperCase(), cX + 24, y + 6);

        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);
        doc.setTextColor(...SLATE);
        doc.text(String(value), cX + 180, y + 6);
        y += 34;
      });

      // ── Amount highlight box ─────────────────────────────
      const boxY = cY + cH + 16;
      doc.setFillColor(...TEAL);
      doc.roundedRect(cX, boxY, cW, 68, 8, 8, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(200, 240, 230);
      doc.text("TOTAL DONATED", W / 2, boxY + 20, { align: "center" });
      doc.setFont("helvetica", "bold");
      doc.setFontSize(28);
      doc.setTextColor(...WHITE);
      doc.text(`${(donation.amount || 0).toLocaleString()} TND`, W / 2, boxY + 50, { align: "center" });

      // ── Legal note ───────────────────────────────────────
      const noteY = boxY + 84;
      doc.setFillColor(...TEAL_L);
      doc.roundedRect(cX, noteY, cW, 54, 6, 6, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...TEAL);
      doc.text(
        "This receipt confirms your charitable donation via DonationConnect.\nPlease retain this document for your records.\nThis is an automatically generated receipt and does not require a signature.",
        W / 2, noteY + 16, { align: "center", lineHeightFactor: 1.6 }
      );

      // ── Footer band ──────────────────────────────────────
      doc.setFillColor(...TEAL);
      doc.rect(0, H - 44, W, 44, "F");
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      doc.setTextColor(200, 240, 230);
      doc.text(
        `Generated on ${new Date().toLocaleString("en-GB")}  ·  DonationConnect`,
        W / 2, H - 18, { align: "center" }
      );

      doc.save(`receipt-${donation._id}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Could not generate receipt.");
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading)
    return (
      <div className="flex justify-center items-center h-64">
        <p className="text-gray-500">Chargement...</p>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Mes donations</h1>

      {donations.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          Vous n'avez pas encore fait de donation.
        </div>
      ) : (
        <div className="space-y-4">
          {donations.map((d) => (
            <div key={d._id}
              className="bg-white rounded-2xl border border-gray-100 p-5 flex justify-between items-center shadow-sm gap-4"
            >
              <div>
                <p className="font-semibold text-gray-800">{d.campaign?.title}</p>
                <p className="text-sm text-gray-400 mt-0.5">
                  {new Date(d.createdAt).toLocaleDateString("fr-FR", {
                    day: "2-digit", month: "long", year: "numeric",
                  })}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-teal-600">{d.amount} TND</p>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                  d.status === "succeeded"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {d.status === "succeeded" ? "Confirmé" : "En attente"}
                </span>
                <div className="mt-3">
                  <button
                    onClick={() => downloadReceipt(d)}
                    disabled={d.status !== "succeeded" || downloadingId === d._id}
                    className="px-3 py-2 rounded-lg text-xs font-semibold bg-teal-50 text-teal-700 hover:bg-teal-100 disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed transition"
                  >
                    {downloadingId === d._id ? "Génération..." : "⬇ Télécharger facture"}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}