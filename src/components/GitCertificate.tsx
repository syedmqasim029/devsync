import React, { useState } from 'react';
import {
  Award,
  Download,
  Printer,
  Share2,
  Check,
  CheckCircle2,
  ShieldCheck,
  Terminal,
  ExternalLink,
  User,
  Calendar,
  Hash
} from 'lucide-react';
import { StudentProfile } from '../types';
import {
  GitAssessmentRecord,
  generateCertificateId,
  saveAssessmentToStorage
} from '../utils/gitCourseEngine';

interface GitCertificateProps {
  profile: StudentProfile;
  assessmentRecord: GitAssessmentRecord;
  onUpdateAssessmentRecord: (updated: GitAssessmentRecord) => void;
  onOpenPortfolio?: () => void;
}

/**
 * Wraps a JPEG data URL rendered from an HTML5 Canvas into a valid single-page
 * landscape A4 PDF 1.4 binary Blob so the user can download a real .pdf file
 * directly without external PDF libraries or popup blockers.
 */
function buildPdfBlobFromJpegDataUrl(
  jpegDataUrl: string,
  pixelWidth: number,
  pixelHeight: number
): Blob {
  const base64Data = jpegDataUrl.split(',')[1] || '';
  const binaryString = window.atob(base64Data);
  const jpegBytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    jpegBytes[i] = binaryString.charCodeAt(i);
  }

  // Landscape A4 in PostScript points (842 x 595 pt)
  const pageWidthPt = 842;
  const pageHeightPt = 595;

  const encoder = new TextEncoder();
  const chunks: BlobPart[] = [];
  const offsets: number[] = [];
  let currentByteOffset = 0;

  const pushText = (str: string) => {
    const bytes = encoder.encode(str);
    chunks.push(bytes as unknown as BlobPart);
    currentByteOffset += bytes.byteLength;
  };

  const pushBytes = (bytes: Uint8Array) => {
    chunks.push(bytes as unknown as BlobPart);
    currentByteOffset += bytes.byteLength;
  };

  const markObject = (objNum: number) => {
    offsets[objNum] = currentByteOffset;
  };

  pushText('%PDF-1.4\n%\xFF\xFF\xFF\xFF\n');

  // 1: Catalog
  markObject(1);
  pushText('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');

  // 2: Pages
  markObject(2);
  pushText('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');

  // 3: Page
  markObject(3);
  pushText(
    `3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidthPt} ${pageHeightPt}] /Resources << /XObject << /Im0 4 0 R >> >> /Contents 5 0 R >>\nendobj\n`
  );

  // 4: Image XObject (DCTDecode JPEG)
  markObject(4);
  pushText(
    `4 0 obj\n<< /Type /XObject /Subtype /Image /Width ${pixelWidth} /Height ${pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${jpegBytes.byteLength} >>\nstream\n`
  );
  pushBytes(jpegBytes);
  pushText('\nendstream\nendobj\n');

  // 5: Content stream drawing the image across the page
  const contentStream = `q\n${pageWidthPt} 0 0 ${pageHeightPt} 0 0 cm\n/Im0 Do\nQ\n`;
  markObject(5);
  pushText(
    `5 0 obj\n<< /Length ${contentStream.length} >>\nstream\n${contentStream}endstream\nendobj\n`
  );

  // Cross-reference table
  const xrefOffset = currentByteOffset;
  pushText('xref\n0 6\n0000000000 65535 f \n');
  for (let i = 1; i <= 5; i++) {
    const padded = String(offsets[i] || 0).padStart(10, '0');
    pushText(`${padded} 00000 n \n`);
  }

  pushText(
    `trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`
  );

  return new Blob(chunks, { type: 'application/pdf' });
}

/**
 * Renders the high-DPI certificate onto an offscreen HTML5 Canvas so it can be
 * exported as a crisp, self-contained PDF document.
 */
function renderCertificateToCanvas(params: {
  recipientName: string;
  certificateId: string;
  completionDateFormatted: string;
  bestScore: number;
  githubUsername?: string;
  university?: string;
}): { dataUrl: string; width: number; height: number } {
  const width = 2200;
  const height = 1556;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    return { dataUrl: '', width, height };
  }

  // Background paper
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, width, height);

  // Outer Navy/Slate Frame
  ctx.strokeStyle = '#0F172A';
  ctx.lineWidth = 14;
  ctx.strokeRect(56, 56, width - 112, height - 112);

  // Inner Brand Blue Accent Frame
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 4;
  ctx.strokeRect(80, 80, width - 160, height - 160);

  // Corner ornaments
  const corners = [
    [80, 80],
    [width - 80, 80],
    [80, height - 80],
    [width - 80, height - 80]
  ];
  ctx.fillStyle = '#2563EB';
  for (const [cx, cy] of corners) {
    ctx.beginPath();
    ctx.arc(cx, cy, 10, 0, Math.PI * 2);
    ctx.fill();
  }

  // Top Header Pill
  ctx.fillStyle = '#EFF6FF';
  ctx.strokeStyle = '#BFDBFE';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(width / 2 - 340, 145, 680, 56, 28);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#1D4ED8';
  ctx.font = 'bold 24px "IBM Plex Mono", monospace';
  ctx.textAlign = 'center';
  ctx.fillText(
    'DEVSYNC OPEN-SOURCE ENGINEERING ACADEMY',
    width / 2,
    181
  );

  // Main Certificate Title
  ctx.fillStyle = '#0A0A0A';
  ctx.font = '800 66px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(
    'DevSync Git & Open-Source',
    width / 2,
    295
  );
  ctx.fillStyle = '#2563EB';
  ctx.fillText(
    'Contribution Certification',
    width / 2,
    375
  );

  // Subtitle
  ctx.fillStyle = '#475569';
  ctx.font = '600 26px "Public Sans", sans-serif';
  ctx.fillText(
    'THIS CREDENTIAL CERTIFIES THAT',
    width / 2,
    460
  );

  // Recipient Name
  ctx.fillStyle = '#0A0A0A';
  ctx.font = '800 84px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(params.recipientName, width / 2, 575);

  // Underline under Recipient Name
  ctx.strokeStyle = '#CBD5E1';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(width / 2 - 420, 610);
  ctx.lineTo(width / 2 + 420, 610);
  ctx.stroke();

  // Optional University / Handle Line
  const metaParts: string[] = [];
  if (params.university) metaParts.push(params.university);
  if (params.githubUsername) metaParts.push(`GitHub: @${params.githubUsername}`);
  if (metaParts.length > 0) {
    ctx.fillStyle = '#334155';
    ctx.font = '600 26px "Public Sans", sans-serif';
    ctx.fillText(metaParts.join('  •  '), width / 2, 660);
  }

  // Achievement Description
  ctx.fillStyle = '#1E293B';
  ctx.font = '500 30px "Public Sans", sans-serif';
  ctx.fillText(
    'has successfully completed all 5 Levels (33 Interactive Modules) of the comprehensive',
    width / 2,
    740
  );
  ctx.fillText(
    'Git & GitHub Open-Source Engineering Curriculum and passed the Final Assessment',
    width / 2,
    788
  );
  ctx.fillText(
    `with a verified score of ${params.bestScore}% (Passing Threshold: 80%).`,
    width / 2,
    836
  );

  // Verified Competencies Row
  const skills = [
    'Git 3-State Architecture',
    'Branching, Merging & Rebasing',
    'Fork & Upstream Workflows',
    'Pull Requests & Code Review',
    'SemVer, Hooks & Commit Signing'
  ];
  const pillWidth = 360;
  const pillGap = 24;
  const totalRowWidth = skills.length * pillWidth + (skills.length - 1) * pillGap;
  let startX = (width - totalRowWidth) / 2;

  for (const skill of skills) {
    ctx.fillStyle = '#F0FDF4';
    ctx.strokeStyle = '#86EFAC';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(startX, 905, pillWidth, 62, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#166534';
    ctx.font = 'bold 21px "Public Sans", sans-serif';
    ctx.fillText(`✓ ${skill}`, startX + pillWidth / 2, 944);
    startX += pillWidth + pillGap;
  }

  // Footer Metadata Blocks (Left: Date, Center: Verified Seal, Right: Certificate ID)
  // Left Box
  ctx.textAlign = 'left';
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 22px "IBM Plex Mono", monospace';
  ctx.fillText('ISSUED ON', 180, 1210);
  ctx.fillStyle = '#0A0A0A';
  ctx.font = 'bold 34px "Plus Jakarta Sans", sans-serif';
  ctx.fillText(params.completionDateFormatted, 180, 1260);
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(180, 1285);
  ctx.lineTo(620, 1285);
  ctx.stroke();
  ctx.fillStyle = '#475569';
  ctx.font = '500 22px "Public Sans", sans-serif';
  ctx.fillText('Date of Completion', 180, 1325);

  // Center Official Verification Seal
  ctx.textAlign = 'center';
  ctx.fillStyle = '#EFF6FF';
  ctx.strokeStyle = '#2563EB';
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(width / 2, 1245, 95, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.strokeStyle = '#1D4ED8';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.beginPath();
  ctx.arc(width / 2, 1245, 78, 0, Math.PI * 2);
  ctx.stroke();
  ctx.setLineDash([]);

  ctx.fillStyle = '#1D4ED8';
  ctx.font = '800 24px "Plus Jakarta Sans", sans-serif';
  ctx.fillText('VERIFIED', width / 2, 1235);
  ctx.fillStyle = '#15803D';
  ctx.font = 'bold 28px "IBM Plex Mono", monospace';
  ctx.fillText(`${params.bestScore}% SCORE`, width / 2, 1272);

  // Right Box (Certificate ID)
  ctx.textAlign = 'right';
  ctx.fillStyle = '#64748B';
  ctx.font = 'bold 22px "IBM Plex Mono", monospace';
  ctx.fillText('CERTIFICATE ID', width - 180, 1210);
  ctx.fillStyle = '#0A0A0A';
  ctx.font = 'bold 34px "IBM Plex Mono", monospace';
  ctx.fillText(params.certificateId, width - 180, 1260);
  ctx.strokeStyle = '#94A3B8';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width - 620, 1285);
  ctx.lineTo(width - 180, 1285);
  ctx.stroke();
  ctx.fillStyle = '#475569';
  ctx.font = '500 22px "Public Sans", sans-serif';
  ctx.fillText('Cryptographic Credential Hash', width - 180, 1325);

  return {
    dataUrl: canvas.toDataURL('image/jpeg', 0.95),
    width,
    height
  };
}

export const GitCertificate: React.FC<GitCertificateProps> = ({
  profile,
  assessmentRecord,
  onUpdateAssessmentRecord,
  onOpenPortfolio
}) => {
  const defaultName =
    assessmentRecord.studentName || profile.name || 'Alex Rivera';
  const [recipientName, setRecipientName] = useState<string>(defaultName);
  const [isEditingName, setIsEditingName] = useState<boolean>(false);
  const [copiedShareLink, setCopiedShareLink] = useState<boolean>(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);

  const completionIso =
    assessmentRecord.passedAt ||
    assessmentRecord.lastAttemptAt ||
    new Date().toISOString();

  const certificateId =
    assessmentRecord.certificateId ||
    generateCertificateId(
      profile.githubUsername || recipientName,
      completionIso
    );

  const completionDateFormatted = new Date(completionIso).toLocaleDateString(
    'en-US',
    {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }
  );

  const handleSaveRecipientName = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = recipientName.trim() || profile.name || 'Student Developer';
    setRecipientName(cleaned);
    setIsEditingName(false);
    const updated: GitAssessmentRecord = {
      ...assessmentRecord,
      studentName: cleaned,
      certificateId
    };
    saveAssessmentToStorage(updated);
    onUpdateAssessmentRecord(updated);
  };

  const handleDownloadPdf = () => {
    setIsDownloadingPdf(true);
    try {
      const rendered = renderCertificateToCanvas({
        recipientName: recipientName.trim() || 'Student Developer',
        certificateId,
        completionDateFormatted,
        bestScore: assessmentRecord.bestScore,
        githubUsername: profile.githubUsername,
        university: profile.university
      });

      if (rendered.dataUrl) {
        const pdfBlob = buildPdfBlobFromJpegDataUrl(
          rendered.dataUrl,
          rendered.width,
          rendered.height
        );
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        const safeName = (recipientName || 'Student')
          .trim()
          .replace(/[^a-zA-Z0-9-_]+/g, '-');
        link.href = url;
        link.download = `DevSync-Git-Certificate-${safeName}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        setTimeout(() => URL.revokeObjectURL(url), 3000);
      }
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handlePrintCertificate = () => {
    window.print();
  };

  const handleShareCertificate = () => {
    const updated: GitAssessmentRecord = {
      ...assessmentRecord,
      studentName: recipientName,
      certificateId,
      sharedOnPortfolio: true
    };
    saveAssessmentToStorage(updated);
    onUpdateAssessmentRecord(updated);

    const handle = encodeURIComponent(profile.githubUsername || 'torvalds');
    const shareUrl = `${window.location.origin}/portfolio/${handle}?cert=${encodeURIComponent(
      certificateId
    )}`;
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(shareUrl).catch(() => {});
    }
    setCopiedShareLink(true);
    setTimeout(() => setCopiedShareLink(false), 3000);
  };

  const competencies = [
    'Git Internals & 3-State Tree',
    'Branching, Merging & Rebasing',
    'Fork & Upstream Workflows',
    'Pull Requests & Code Review',
    'SemVer, Hooks & Commit Signing'
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Control & Customization Toolbar (Hidden when printing) */}
      <div className="print:hidden p-5 rounded-2xl bg-white border border-slate-200 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 text-emerald-700 text-xs font-display font-bold uppercase tracking-wider">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Official Credential Unlocked • Verified Score: {assessmentRecord.bestScore}%</span>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-xs text-slate-700 font-medium">
              Recipient Name on Certificate:
            </span>
            {isEditingName ? (
              <form onSubmit={handleSaveRecipientName} className="flex items-center gap-2">
                <input
                  type="text"
                  value={recipientName}
                  onChange={(e) => setRecipientName(e.target.value)}
                  aria-label="Certificate Recipient Name"
                  className="px-3 py-1 rounded-lg bg-slate-50 border border-slate-300 text-xs font-display font-bold text-[#0A0A0A] focus:outline-none focus:border-blue-600"
                />
                <button
                  type="submit"
                  className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-display font-bold cursor-pointer"
                >
                  Save Name
                </button>
              </form>
            ) : (
              <div className="flex items-center gap-2">
                <strong className="text-sm font-display font-bold text-[#0A0A0A]">
                  {recipientName}
                </strong>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-100 text-[#0A0A0A] border border-slate-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                >
                  <User className="w-3 h-3 text-blue-600" />
                  <span>Edit Name</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={handleDownloadPdf}
            disabled={isDownloadingPdf}
            className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 border border-blue-700 text-white text-xs sm:text-sm font-display font-bold flex items-center gap-2 shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isDownloadingPdf ? 'Generating PDF...' : 'Download as PDF'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrintCertificate}
            className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-[#0A0A0A] text-xs sm:text-sm font-display font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4 text-slate-700" />
            <span>Print / Save PDF</span>
          </button>

          <button
            type="button"
            onClick={handleShareCertificate}
            className="px-3.5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 border border-emerald-700 text-white text-xs sm:text-sm font-display font-bold flex items-center gap-1.5 shadow-2xs transition-colors cursor-pointer"
          >
            {copiedShareLink ? (
              <>
                <Check className="w-4 h-4" />
                <span>Shared &amp; Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share to Portfolio</span>
              </>
            )}
          </button>

          {onOpenPortfolio && (
            <button
              type="button"
              onClick={onOpenPortfolio}
              className="px-3.5 py-2.5 rounded-xl bg-white hover:bg-slate-100 border border-slate-300 text-[#0A0A0A] text-xs sm:text-sm font-display font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <span>View on Portfolio</span>
              <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            </button>
          )}
        </div>
      </div>

      {/* Printable / Visual Certificate Document */}
      <div
        id="devsync-printable-certificate"
        className="relative rounded-3xl bg-white border-4 border-slate-900 p-3 sm:p-5 shadow-xl overflow-hidden"
      >
        <div className="rounded-2xl border-2 border-blue-600 p-6 sm:p-12 bg-white relative">
          {/* Corner Accents */}
          <div className="w-3 h-3 rounded-full bg-blue-600 absolute top-3 left-3" />
          <div className="w-3 h-3 rounded-full bg-blue-600 absolute top-3 right-3" />
          <div className="w-3 h-3 rounded-full bg-blue-600 absolute bottom-3 left-3" />
          <div className="w-3 h-3 rounded-full bg-blue-600 absolute bottom-3 right-3" />

          <div className="max-w-3xl mx-auto text-center space-y-6">
            {/* Brand Emblem */}
            <div className="flex flex-col items-center gap-2">
              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-200">
                <div className="w-6 h-6 rounded-lg bg-blue-600 flex items-center justify-center">
                  <Terminal className="w-3.5 h-3.5 text-white" />
                </div>
                <span className="font-mono text-xs font-bold uppercase tracking-widest text-blue-800">
                  DevSync Open-Source Engineering Academy
                </span>
              </div>
            </div>

            {/* Certificate Title */}
            <div className="space-y-1">
              <h2 className="font-display text-2xl sm:text-4xl font-extrabold text-[#0A0A0A] tracking-tight">
                DevSync Git &amp; Open-Source
              </h2>
              <p className="font-display text-xl sm:text-3xl font-extrabold text-blue-600">
                Contribution Certification
              </p>
            </div>

            <p className="text-xs font-mono font-bold uppercase tracking-widest text-slate-600">
              This Credential Certifies That
            </p>

            {/* Student Name */}
            <div className="py-2 border-b-2 border-slate-200 max-w-xl mx-auto">
              <div
                data-testid="certificate-recipient-name"
                className="font-display text-3xl sm:text-5xl font-extrabold text-[#0A0A0A] tracking-tight"
              >
                {recipientName}
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-center gap-3 text-xs font-medium text-slate-700">
                {profile.university && <span>{profile.university}</span>}
                {profile.githubUsername && (
                  <span className="font-mono font-semibold text-blue-700">
                    @{profile.githubUsername}
                  </span>
                )}
              </div>
            </div>

            {/* Credential Statement */}
            <p className="text-sm sm:text-base text-slate-700 leading-relaxed max-w-2xl mx-auto">
              has successfully completed all{' '}
              <strong className="text-[#0A0A0A]">
                5 Levels (33 Interactive Modules)
              </strong>{' '}
              of the comprehensive Git &amp; GitHub Open-Source Engineering Curriculum and passed the{' '}
              <strong className="text-[#0A0A0A]">
                Final Technical Assessment
              </strong>{' '}
              with a verified score of{' '}
              <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-300 font-mono font-bold tabular-nums">
                {assessmentRecord.bestScore}%
              </span>
              .
            </p>

            {/* Verified Competency Badges */}
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              {competencies.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-300 text-xs font-semibold flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{skill}</span>
                </span>
              ))}
            </div>

            {/* Footer Signatures, Official Seal & Certificate ID */}
            <div className="pt-8 mt-4 border-t border-slate-200 grid grid-cols-1 sm:grid-cols-3 items-center gap-6 text-left">
              {/* Completion Date */}
              <div className="space-y-1 text-center sm:text-left">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 flex items-center justify-center sm:justify-start gap-1">
                  <Calendar className="w-3.5 h-3.5 text-blue-600" />
                  <span>Issued On</span>
                </div>
                <div className="font-display text-sm sm:text-base font-bold text-[#0A0A0A]">
                  {completionDateFormatted}
                </div>
                <div className="text-xs text-slate-600">
                  Verified Completion Date
                </div>
              </div>

              {/* Official Seal */}
              <div className="flex flex-col items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-blue-50 border-2 border-blue-600 flex flex-col items-center justify-center shadow-xs">
                  <Award className="w-7 h-7 text-blue-600 mb-0.5" />
                  <span className="text-[10px] font-mono font-extrabold uppercase tracking-wider text-blue-900">
                    VERIFIED
                  </span>
                  <span className="text-xs font-mono font-bold text-emerald-700 tabular-nums">
                    {assessmentRecord.bestScore}% PASS
                  </span>
                </div>
              </div>

              {/* Unique Certificate ID */}
              <div className="space-y-1 text-center sm:text-right">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600 flex items-center justify-center sm:justify-end gap-1">
                  <Hash className="w-3.5 h-3.5 text-blue-600" />
                  <span>Certificate ID</span>
                </div>
                <div
                  data-testid="certificate-unique-id"
                  className="font-mono text-sm sm:text-base font-bold text-[#0A0A0A] tabular-nums"
                >
                  {certificateId}
                </div>
                <div className="text-xs text-slate-600">
                  Cryptographic Credential Hash
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
