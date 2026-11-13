/**
 * BeSafe Network - Email Services
 * Brutalist themed email templates for the global safety network.
 */

const THEME = {
  bg: '#E4E3E0',
  text: '#141414',
  accent: '#141414',
  border: '#141414',
};

const baseTemplate = (content: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { 
      background-color: ${THEME.bg}; 
      color: ${THEME.text}; 
      font-family: 'Courier New', Courier, monospace; 
      margin: 0; 
      padding: 40px 20px; 
    }
    .container { 
      max-width: 600px; 
      margin: 0 auto; 
      border: 4px solid ${THEME.border}; 
      background-color: white; 
      padding: 40px; 
    }
    .header { 
      border-bottom: 4px solid ${THEME.border}; 
      padding-bottom: 20px; 
      margin-bottom: 30px; 
    }
    .title { 
      font-size: 24px; 
      font-weight: bold; 
      text-transform: uppercase; 
      letter-spacing: -1px; 
      margin: 0; 
    }
    .content { 
      font-size: 14px; 
      line-height: 1.6; 
      margin-bottom: 30px; 
    }
    .footer { 
      font-size: 10px; 
      text-transform: uppercase; 
      letter-spacing: 1px; 
      opacity: 0.5; 
      border-top: 1px solid ${THEME.border}; 
      padding-top: 20px; 
    }
    .button { 
      display: inline-block; 
      background-color: ${THEME.accent}; 
      color: ${THEME.bg} !important; 
      padding: 15px 30px; 
      text-decoration: none; 
      text-transform: uppercase; 
      font-weight: bold; 
      letter-spacing: 1px; 
      margin-top: 20px; 
    }
    .api-key-box {
      background-color: #f0f0f0;
      border: 2px dashed ${THEME.border};
      padding: 20px;
      font-family: monospace;
      font-size: 16px;
      word-break: break-all;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">BeSafe Network</h1>
    </div>
    <div class="content">
      ${content}
    </div>
    <div class="footer">
      © 2026 BeSafe Network / Global Identity & Safety Layer
    </div>
  </div>
</body>
</html>
`;

export const getApiKeyApprovedEmail = (botName: string, key: string, appUrl: string) => {
  const content = `
    <p>Your application for a Developer API Key has been <strong>APPROVED</strong>.</p>
    <p>Application: <strong>${botName}</strong></p>
    <p>Your keys are sensitive. Do not share them. They provide privileged access to the BeSafe Network global banlist and user reputation data.</p>
    
    <div class="api-key-box">${key}</div>
    
    <p>Integration documentation can be found in your private developer portal:</p>
    <a href="${appUrl}/docs/private" class="button">Access Documentation</a>
  `;
  return {
    subject: `API ACCESS GRANTED: ${botName}`,
    html: baseTemplate(content),
    text: `Your API key for ${botName} has been approved. Key: ${key}. Documentation: ${appUrl}/docs/private`
  };
};

export const getApiKeyRevokedEmail = (botName: string) => {
  const content = `
    <h2 style="color: #dc2626;">SECURITY ALERT: API KEY REVOKED</h2>
    <p>The API access for your bot <strong>${botName}</strong> has been <strong>REVOKED</strong> by the BeSafe Network administrative team.</p>
    <p>Reason: Policy violation or security maintenance.</p>
    <p>Effective immediately, all requests made with your previous API key will return a 401 Unauthorized error.</p>
    <p>If you believe this is an error, please contact the network administrators.</p>
  `;
  return {
    subject: `SECURITY ALERT: API Key Revoked for ${botName}`,
    html: baseTemplate(content),
    text: `SECURITY ALERT: The API access for ${botName} has been REVOKED.`
  };
};

export const getPasswordResetEmail = (resetUrl: string) => {
  const content = `
    <p>A password reset has been requested for your administrator account.</p>
    <p>Click the button below to set a new password. This link will expire in 1 hour.</p>
    <div style="margin: 25px 0;">
      <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" class="button" style="display: inline-block; background-color: #141414; color: #ffffff !important; padding: 16px 32px; text-decoration: none; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; font-family: monospace, sans-serif; font-size: 14px; border: 2px solid #141414;">Reset Password</a>
    </div>
    <p style="margin-top: 25px; font-size: 12px; line-height: 1.5; word-break: break-all; opacity: 0.85; color: #141414;">
      Or click or copy and paste this link into your browser:<br/>
      <a href="${resetUrl}" target="_blank" rel="noopener noreferrer" style="color: #141414; text-decoration: underline; font-weight: bold; word-break: break-all;">${resetUrl}</a>
    </p>
    <p style="margin-top: 30px; font-size: 11px; opacity: 0.6;">If you did not request this, you can safely ignore this email.</p>
  `;
  return {
    subject: 'ADMIN ACCESS: Password Reset Request',
    html: baseTemplate(content),
    text: `Reset your admin password by visiting:\n${resetUrl}`
  };
};

export const getEmailVerificationEmail = (verifyUrl: string) => {
  const content = `
    <p>Welcome to the BeSafe Network. Please verify your email address to activate your administrator account.</p>
    <p>Click the button below to verify your account. This is a required security step.</p>
    <div style="margin: 25px 0;">
      <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" class="button" style="display: inline-block; background-color: #141414; color: #ffffff !important; padding: 16px 32px; text-decoration: none; text-transform: uppercase; font-weight: bold; letter-spacing: 1px; font-family: monospace, sans-serif; font-size: 14px; border: 2px solid #141414;">Verify Email Address</a>
    </div>
    <p style="margin-top: 25px; font-size: 12px; line-height: 1.5; word-break: break-all; opacity: 0.85; color: #141414;">
      Or click or copy and paste this link into your browser:<br/>
      <a href="${verifyUrl}" target="_blank" rel="noopener noreferrer" style="color: #141414; text-decoration: underline; font-weight: bold; word-break: break-all;">${verifyUrl}</a>
    </p>
    <p style="margin-top: 30px; font-size: 11px; opacity: 0.6;">If you did not create this account, please ignore this email.</p>
  `;
  return {
    subject: 'ADMIN ACCESS: Email Verification Required',
    html: baseTemplate(content),
    text: `Verify your email address by visiting:\n${verifyUrl}`
  };
};

export const getGeneralAlertEmail = (title: string, message: string, actionUrl?: string) => {
  const content = `
    <h2 style="text-transform: uppercase;">${title}</h2>
    <p>${message}</p>
    ${actionUrl ? `<a href="${actionUrl}" class="button">View Details</a>` : ''}
  `;
  return {
    subject: `[ALERT] ${title}`,
    html: baseTemplate(content),
    text: `${title}: ${message}`
  };
};

export const getAppealMessageEmail = (userId: string, message: string, replyUrl: string, attachments: string[] = []) => {
  const mailAttachments: any[] = [];

  const attachmentsHtml = Array.isArray(attachments) && attachments.length > 0
    ? `
      <div style="margin-top: 20px; padding-top: 15px; border-top: 2px dashed #141414;">
        <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; color: #141414;">
          Attached Evidence & Images (${attachments.length}):
        </p>
        <div>
          ${attachments.map((url, idx) => {
            let imgSrc = url;
            if (typeof url === 'string' && url.startsWith('data:image/')) {
              const matches = url.match(/^data:(image\/([a-zA-Z0-9]+));base64,(.+)$/);
              if (matches) {
                const mimeType = matches[1];
                const ext = matches[2] || 'png';
                const base64Data = matches[3];
                const cid = `evidence_${idx}_${Date.now()}`;
                imgSrc = `cid:${cid}`;
                mailAttachments.push({
                  filename: `evidence_${idx + 1}.${ext}`,
                  content: Buffer.from(base64Data, 'base64'),
                  contentType: mimeType,
                  cid: cid,
                  contentDisposition: 'inline'
                });
              }
            }
            return `
              <div style="margin-bottom: 12px;">
                <img src="${imgSrc}" alt="Attachment Evidence ${idx + 1}" style="max-width: 100%; border: 3px solid #141414; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `
    : '';

  const content = `
    <h2 style="text-transform: uppercase; color: #dc2626;">Safety Network: Ban Appeal Status</h2>
    <p>The administrative team has sent you a message regarding your appeal (User ID: ${userId}).</p>
    
    <div style="background-color: #f0f0f0; border-left: 4px solid #141414; padding: 20px; margin: 20px 0; font-family: sans-serif;">
      ${message ? `<p style="margin-top: 0;">"${message}"</p>` : ''}
      ${attachmentsHtml}
    </div>
    
    <p>You can reply directly to this message or provide additional evidence by clicking the button below. <strong>No account is required to reply.</strong></p>
    
    <a href="${replyUrl}" class="button">Reply to Administrator</a>
    
    <p style="margin-top: 30px; font-size: 11px; opacity: 0.6;">This is an automated transmission from the BeSafe Network Global Ban System. Please do not reply directly to this email.</p>
  `;

  return {
    subject: `Re: Appeal Update for Subject ${userId}`,
    html: baseTemplate(content),
    text: `Admin Message: ${message}. ${attachments.length > 0 ? `[${attachments.length} Image Attachments]` : ''} Reply here: ${replyUrl}`,
    mailAttachments
  };
};

export const getAppealOutcomeEmail = (userId: string, status: 'approved' | 'denied', notes?: string) => {
  const content = `
    <h2 style="text-transform: uppercase; color: ${status === 'approved' ? '#059669' : '#dc2626'};">
      Ban Appeal ${status === 'approved' ? 'APPROVED' : 'DENIED'}
    </h2>
    <p>The BeSafe Network administrative team has completed the final review of your ban appeal (User ID: ${userId}).</p>
    
    <div style="background-color: #f0f0f0; border-left: 4px solid #141414; padding: 20px; margin: 20px 0;">
      <strong>DECISION:</strong> ${status === 'approved' ? 'ENFORCEMENT ACTION REVOKED' : 'ENFORCEMENT ACTION UPHELD'}<br/>
      ${notes ? `<br/><strong>ADMINISTRATOR NOTES:</strong><br/>"${notes}"` : ''}
    </div>
    
    ${status === 'approved' 
      ? '<p>Your global ban has been revoked. You are now free to use participating Discord servers and services again. Please ensure future compliance with safety standards.</p>' 
      : '<p>Your global ban remains in effect. This decision is final and cannot be appealed further through our standard automated channels.</p>'
    }

    <p style="margin-top: 30px; font-size: 11px; opacity: 0.6;">© 2026 BeSafe Network / Global Identity & Safety Layer</p>
  `;
  return {
    subject: `FINAL DECISION: Ban Appeal for ${userId} - [${status.toUpperCase()}]`,
    html: baseTemplate(content),
    text: `Your ban appeal was ${status}. Notes: ${notes || 'None'}`
  };
};

export const getReportOutcomeEmail = (targetId: string, status: 'reviewed' | 'dismissed') => {
  const content = `
    <h2 style="text-transform: uppercase;">Safety Report Outcome</h2>
    <p>Thank you for submitting a report to the BeSafe Network. Your intelligence submission regarding Subject <strong>${targetId}</strong> has been processed.</p>
    
    <div style="background-color: #f0f0f0; border-left: 4px solid #141414; padding: 20px; margin: 20px 0;">
      <strong>OUTCOME:</strong> ${status === 'reviewed' ? 'ENFORCEMENT ACTION TAKEN' : 'NO ACTION TAKEN (DISMISSED)'}
    </div>
    
    ${status === 'reviewed' 
      ? '<p>Based on your evidence, our administrative team has issued a global ban for this subject. Your contribution helps keep the ecosystem safe.</p>' 
      : '<p>After careful review, our administrative team has determined that the provided evidence was insufficient for global enforcement action. This report has been archived.</p>'
    }

    <p style="margin-top: 30px; font-size: 11px; opacity: 0.6;">© 2026 BeSafe Network / Global Identity & Safety Layer</p>
  `;
  return {
    subject: `Report Status: ${targetId} - ${status === 'reviewed' ? 'Subject Enforced' : 'Closed'}`,
    html: baseTemplate(content),
    text: `Your report for ${targetId} was ${status === 'reviewed' ? 'accepted and enforcement action taken' : 'dismissed Due to insufficient evidence'}.`
  };
};

export const getReportMessageEmail = (targetId: string, message: string, replyUrl: string, attachments: string[] = []) => {
  const mailAttachments: any[] = [];

  const attachmentsHtml = Array.isArray(attachments) && attachments.length > 0
    ? `
      <div style="margin-top: 20px; padding-top: 15px; border-top: 2px dashed #141414;">
        <p style="font-size: 11px; font-weight: bold; text-transform: uppercase; margin-bottom: 10px; color: #141414;">
          Attached Evidence & Images (${attachments.length}):
        </p>
        <div>
          ${attachments.map((url, idx) => {
            let imgSrc = url;
            if (typeof url === 'string' && url.startsWith('data:image/')) {
              const matches = url.match(/^data:(image\/([a-zA-Z0-9]+));base64,(.+)$/);
              if (matches) {
                const mimeType = matches[1];
                const ext = matches[2] || 'png';
                const base64Data = matches[3];
                const cid = `evidence_${idx}_${Date.now()}`;
                imgSrc = `cid:${cid}`;
                mailAttachments.push({
                  filename: `evidence_${idx + 1}.${ext}`,
                  content: Buffer.from(base64Data, 'base64'),
                  contentType: mimeType,
                  cid: cid,
                  contentDisposition: 'inline'
                });
              }
            }
            return `
              <div style="margin-bottom: 12px;">
                <img src="${imgSrc}" alt="Attachment Evidence ${idx + 1}" style="max-width: 100%; border: 3px solid #141414; border-radius: 6px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);" />
              </div>
            `;
          }).join('')}
        </div>
      </div>
    `
    : '';

  const content = `
    <h2 style="text-transform: uppercase; color: #141414;">Safety Network: Report Investigation Update</h2>
    <p>Our investigation team has sent you a message regarding your safety report (Target Subject ID: ${targetId}).</p>
    
    <div style="background-color: #f0f0f0; border-left: 4px solid #141414; padding: 20px; margin: 20px 0; font-family: sans-serif;">
      ${message ? `<p style="margin-top: 0;">"${message}"</p>` : ''}
      ${attachmentsHtml}
    </div>
    
    <p>You can reply directly to this message or provide additional evidence by clicking the button below. <strong>No account is required to reply.</strong></p>
    
    <a href="${replyUrl}" class="button">Reply to Investigation Staff</a>
    
    <p style="margin-top: 30px; font-size: 11px; opacity: 0.6;">This is an automated transmission from the BeSafe Network Safety Operations. Please do not reply directly to this email address.</p>
  `;

  return {
    subject: `Re: Safety Report Case Update (Target Subject ${targetId})`,
    html: baseTemplate(content),
    text: `Staff Message regarding report against ${targetId}: ${message}. Reply here: ${replyUrl}`,
    mailAttachments
  };
};

export const getAccountBannedEmail = (username: string, reason: string, appealUrl?: string) => {
  const safeReason = reason || 'Violation of BeSafe Network Terms of Service or Safety Policies';
  const content = `
    <h2 style="text-transform: uppercase; color: #dc2626;">SECURITY NOTICE: ACCOUNT BLOCKED / SUSPENDED</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>Your BeSafe Network account has been <strong>BLOCKED (BANNED)</strong> by an administrator.</p>
    <div style="background-color: #fef2f2; border-left: 4px solid #dc2626; padding: 20px; margin: 20px 0;">
      <strong>ACCOUNT:</strong> ${username}<br/>
      <strong>STATUS:</strong> BLOCKED / SUSPENDED<br/>
      <strong>REASON:</strong> ${safeReason}
    </div>
    <p>Effective immediately, your access to the BeSafe Network dashboard and associated account services has been revoked.</p>
    ${appealUrl ? `<p>If you believe this action was taken in error, you may submit an appeal via the portal below:</p><a href="${appealUrl}" class="button">Submit Appeal</a>` : ''}
    <p style="margin-top: 30px; font-size: 11px; opacity: 0.6;">© 2026 BeSafe Network / Global Identity & Safety Layer</p>
  `;
  return {
    subject: `SECURITY NOTICE: Your BeSafe Network Account (${username}) Has Been Blocked`,
    html: baseTemplate(content),
    text: `Hello ${username}, your BeSafe Network account has been blocked/suspended by an administrator. Reason: ${safeReason}.${appealUrl ? ` Appeal here: ${appealUrl}` : ''}`
  };
};

export const getAccountUnbannedEmail = (username: string, loginUrl?: string) => {
  const content = `
    <h2 style="text-transform: uppercase; color: #059669;">ACCOUNT ACCESS RESTORED</h2>
    <p>Hello <strong>${username}</strong>,</p>
    <p>Your BeSafe Network account restriction has been <strong>LIFTED</strong> by an administrator. Your account is now active again.</p>
    ${loginUrl ? `<div style="margin: 25px 0;"><a href="${loginUrl}" class="button">Login to Dashboard</a></div>` : ''}
    <p style="margin-top: 30px; font-size: 11px; opacity: 0.6;">© 2026 BeSafe Network / Global Identity & Safety Layer</p>
  `;
  return {
    subject: `ACCOUNT RESTORED: Your BeSafe Network Account (${username}) Is Active Again`,
    html: baseTemplate(content),
    text: `Hello ${username}, your BeSafe Network account restriction has been lifted.${loginUrl ? ` Login here: ${loginUrl}` : ''}`
  };
};

