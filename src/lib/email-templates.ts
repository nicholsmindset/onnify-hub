/** Shared email HTML builder for portal notifications.
 *  The edge function replaces {PORTAL_URL} and {CONTACT_NAME} server-side.
 */

const base = (title: string, body: string) => `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f8fafc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <div style="max-width:560px;margin:40px auto;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 1px 4px rgba(0,0,0,0.08);">
    <!-- Header -->
    <div style="background:#0f172a;padding:24px 32px;">
      <span style="color:#ffffff;font-weight:700;font-size:16px;letter-spacing:-0.3px;">ONNIFY WORKS</span>
    </div>
    <!-- Body -->
    <div style="padding:32px;">
      <h2 style="margin:0 0 8px;color:#0f172a;font-size:20px;font-weight:700;">${title}</h2>
      ${body}
      <div style="margin-top:28px;">
        <a href="{PORTAL_URL}" style="display:inline-block;background:#6366f1;color:#ffffff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;">
          Open your portal →
        </a>
      </div>
    </div>
    <!-- Footer -->
    <div style="padding:20px 32px;border-top:1px solid #f1f5f9;">
      <p style="margin:0;color:#94a3b8;font-size:12px;">
        You're receiving this because you have a client portal with Onnify Works.<br>
        <a href="{PORTAL_URL}" style="color:#6366f1;text-decoration:none;">View portal</a>
      </p>
    </div>
  </div>
</body>
</html>`;

export function portalMessageEmail(opts: { senderName: string; preview: string }) {
  const body = `
    <p style="color:#374151;margin:0 0 16px;">Hi {CONTACT_NAME},</p>
    <p style="color:#374151;margin:0 0 16px;">${opts.senderName} sent you a message:</p>
    <div style="background:#f8fafc;border-left:3px solid #6366f1;padding:16px;border-radius:4px;margin-bottom:16px;">
      <p style="color:#374151;margin:0;font-style:italic;">"${opts.preview}"</p>
    </div>
    <p style="color:#374151;margin:0;">Reply by logging into your portal below.</p>`;
  return base("New message from your project team", body);
}

export function deliverableStatusEmail(opts: { deliverableName: string; status: string }) {
  const statusColors: Record<string, string> = {
    "In Progress": "#3b82f6",
    "In Review":   "#f59e0b",
    "Delivered":   "#10b981",
    "Not Started": "#6b7280",
  };
  const color = statusColors[opts.status] ?? "#6366f1";
  const body = `
    <p style="color:#374151;margin:0 0 16px;">Hi {CONTACT_NAME},</p>
    <p style="color:#374151;margin:0 0 16px;">We've updated the status of a deliverable:</p>
    <div style="background:#f8fafc;padding:16px;border-radius:8px;margin-bottom:16px;">
      <p style="color:#374151;margin:0 0 8px;font-weight:600;">${opts.deliverableName}</p>
      <span style="display:inline-block;background:${color};color:#ffffff;padding:4px 12px;border-radius:99px;font-size:13px;font-weight:600;">
        ${opts.status}
      </span>
    </div>
    <p style="color:#374151;margin:0;">View your full project board in the portal.</p>`;
  return base("Project update", body);
}

export function newFileEmail(opts: { fileName: string; uploadedBy: string }) {
  const body = `
    <p style="color:#374151;margin:0 0 16px;">Hi {CONTACT_NAME},</p>
    <p style="color:#374151;margin:0 0 16px;">${opts.uploadedBy} shared a new file with you:</p>
    <div style="background:#f8fafc;border:1px solid #e2e8f0;padding:16px;border-radius:8px;margin-bottom:16px;display:flex;align-items:center;gap:12px;">
      <span style="font-size:24px;">📎</span>
      <span style="color:#0f172a;font-weight:600;">${opts.fileName}</span>
    </div>
    <p style="color:#374151;margin:0;">Download it from your portal files section.</p>`;
  return base("New file shared with you", body);
}
