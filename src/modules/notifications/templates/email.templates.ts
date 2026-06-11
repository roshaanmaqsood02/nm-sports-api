export interface EmailTemplateData {
  recipientName?: string;
  [key: string]: any;
}

const layout = (content: string, previewText = '') => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NMSports</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Tahoma, Arial, sans-serif; background: #F4F6F9; color: #333333; }
    .wrapper   { max-width: 600px; margin: 30px auto; background: #FFFFFF; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.08); }
    .header    { background: #1A1A2E; padding: 28px 32px; text-align: center; }
    .header h1 { color: #FFFFFF; font-size: 22px; font-weight: 700; letter-spacing: 1px; }
    .header p  { color: #AAAACC; font-size: 12px; margin-top: 4px; }
    .body      { padding: 32px; }
    .greeting  { font-size: 16px; font-weight: 600; color: #1A1A2E; margin-bottom: 12px; }
    .message   { font-size: 14px; line-height: 1.7; color: #555555; }
    .divider   { border: none; border-top: 1px solid #E8E8E8; margin: 24px 0; }
    .btn       { display: inline-block; padding: 13px 28px; background: #1A1A2E; color: #FFFFFF !important; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px; margin: 20px 0; }
    .info-box  { background: #F7F8FC; border-left: 4px solid #1A1A2E; border-radius: 4px; padding: 14px 16px; margin: 18px 0; font-size: 13px; }
    .info-row  { display: flex; justify-content: space-between; margin-bottom: 6px; font-size: 13px; }
    .label     { color: #888888; font-weight: 500; }
    .value     { color: #1A1A2E; font-weight: 600; }
    .footer    { background: #F4F6F9; padding: 20px 32px; text-align: center; font-size: 11px; color: #AAAAAA; line-height: 1.6; }
    .footer a  { color: #1A1A2E; text-decoration: none; }
    .badge     { display: inline-block; padding: 3px 10px; border-radius: 20px; font-size: 11px; font-weight: 600; }
    .badge-success  { background: #D4EDDA; color: #155724; }
    .badge-warning  { background: #FFF3CD; color: #856404; }
    .badge-danger   { background: #F8D7DA; color: #721C24; }
    .badge-info     { background: #D1ECF1; color: #0C5460; }
  </style>
</head>
<body>
  ${previewText ? `<div style="display:none;max-height:0;overflow:hidden;">${previewText}</div>` : ''}
  <div class="wrapper">
    <div class="header">
      <h1>⚽ NMSports</h1>
      <p>Sports Management Platform</p>
    </div>
    <div class="body">
      ${content}
    </div>
    <div class="footer">
      <p>© ${new Date().getFullYear()} NMSports. All rights reserved.</p>
      <p style="margin-top:6px;">
        <a href="#">Unsubscribe</a> · <a href="#">Privacy Policy</a> · <a href="#">Help</a>
      </p>
      <p style="margin-top:6px; color: #CCCCCC;">
        You received this email because you are registered on NMSports.
      </p>
    </div>
  </div>
</body>
</html>`;

// Templates
export const EmailTemplates = {
  welcome: (data: { name: string; loginUrl?: string }) =>
    layout(
      `
      <p class="greeting">Welcome to NMSports, ${data.name}! 🎉</p>
      <p class="message">
        Your account has been created successfully. You can now manage your
        sports organization, teams, players, leagues, and tournaments all from one place.
      </p>
      <hr class="divider">
      <div class="info-box">
        <p style="font-weight:600; margin-bottom:8px;">Getting Started</p>
        <p>Create or join an organization</p>
        <p>Add your teams and players</p>
        <p>Schedule matches and tournaments</p>
        <p>Track stats and standings</p>
      </div>
      ${data.loginUrl ? `<a href="${data.loginUrl}" class="btn">Go to Dashboard →</a>` : ''}
    `,
      `Welcome to NMSports, ${data.name}!`,
    ),

  passwordReset: (data: {
    name: string;
    resetUrl: string;
    expiresIn: string;
  }) =>
    layout(
      `
      <p class="greeting">Password Reset Request</p>
      <p class="message">
        Hi <strong>${data.name}</strong>,<br><br>
        We received a request to reset your password. Click the button below.
        This link expires in <strong>${data.expiresIn}</strong>.
      </p>
      <a href="${data.resetUrl}" class="btn">Reset My Password →</a>
      <hr class="divider">
      <p class="message" style="font-size:12px; color:#999;">
        If you didn't request this, please ignore this email. Your password won't change.
      </p>
    `,
      'Reset your NMSports password',
    ),

  passwordChanged: (data: {
    name: string;
    ipAddress?: string;
    time?: string;
  }) =>
    layout(
      `
      <p class="greeting">Password Changed Successfully</p>
      <p class="message">Hi <strong>${data.name}</strong>, your password was recently changed.</p>
      <div class="info-box">
        ${data.time ? `<div class="info-row"><span class="label">Time</span><span class="value">${data.time}</span></div>` : ''}
        ${data.ipAddress ? `<div class="info-row"><span class="label">IP Address</span><span class="value">${data.ipAddress}</span></div>` : ''}
      </div>
      <p class="message">If you didn't make this change, please contact support immediately.</p>
    `,
      'Your NMSports password has been changed',
    ),

  matchScheduled: (data: {
    name: string;
    homeTeam: string;
    visitorTeam: string;
    date: string;
    time: string;
    location: string;
    matchUrl?: string;
  }) =>
    layout(
      `
      <p class="greeting">Match Scheduled 🏆</p>
      <p class="message">Hi <strong>${data.name}</strong>, a new match has been scheduled.</p>
      <div class="info-box">
        <div class="info-row"><span class="label">Home Team</span>   <span class="value">${data.homeTeam}</span></div>
        <div class="info-row"><span class="label">Visitor Team</span><span class="value">${data.visitorTeam}</span></div>
        <div class="info-row"><span class="label">Date</span>        <span class="value">${data.date}</span></div>
        <div class="info-row"><span class="label">Time</span>        <span class="value">${data.time}</span></div>
        <div class="info-row"><span class="label">Location</span>    <span class="value">${data.location}</span></div>
      </div>
      ${data.matchUrl ? `<a href="${data.matchUrl}" class="btn">View Match →</a>` : ''}
    `,
      `New match: ${data.homeTeam} vs ${data.visitorTeam}`,
    ),

  matchReminder: (data: {
    name: string;
    homeTeam: string;
    visitorTeam: string;
    startsIn: string;
    location: string;
    matchUrl?: string;
  }) =>
    layout(
      `
      <p class="greeting">⏰ Match Reminder</p>
      <p class="message">
        Hi <strong>${data.name}</strong>,<br>
        <strong>${data.homeTeam} vs ${data.visitorTeam}</strong> starts in
        <strong>${data.startsIn}</strong>!
      </p>
      <div class="info-box">
        <div class="info-row"><span class="label">Location</span><span class="value">${data.location}</span></div>
        <div class="info-row"><span class="label">Starts In</span><span class="value">${data.startsIn}</span></div>
      </div>
      ${data.matchUrl ? `<a href="${data.matchUrl}" class="btn">View Match →</a>` : ''}
    `,
      `Match reminder: ${data.homeTeam} vs ${data.visitorTeam} in ${data.startsIn}`,
    ),

  matchCompleted: (data: {
    name: string;
    homeTeam: string;
    visitorTeam: string;
    homeScore: number;
    visitorScore: number;
    matchUrl?: string;
  }) =>
    layout(
      `
      <p class="greeting">Match Result ⚡</p>
      <p class="message">Hi <strong>${data.name}</strong>, the match has concluded.</p>
      <div style="text-align:center; padding: 24px; background:#F7F8FC; border-radius:8px; margin:20px 0;">
        <p style="font-size:13px; color:#888; margin-bottom:8px;">FINAL SCORE</p>
        <p style="font-size:26px; font-weight:700; color:#1A1A2E;">
          ${data.homeTeam} <span style="color:#0F3460;">${data.homeScore} – ${data.visitorScore}</span> ${data.visitorTeam}
        </p>
        <span class="badge badge-success" style="margin-top:8px;">COMPLETED</span>
      </div>
      ${data.matchUrl ? `<a href="${data.matchUrl}" class="btn">View Details →</a>` : ''}
    `,
      `Result: ${data.homeTeam} ${data.homeScore}-${data.visitorScore} ${data.visitorTeam}`,
    ),

  teamMemberAdded: (data: {
    name: string;
    teamName: string;
    role: string;
    teamUrl?: string;
  }) =>
    layout(
      `
      <p class="greeting">You've Been Added to a Team 🏅</p>
      <p class="message">
        Hi <strong>${data.name}</strong>,<br>
        You have been added to <strong>${data.teamName}</strong> as
        <strong>${data.role}</strong>.
      </p>
      ${data.teamUrl ? `<a href="${data.teamUrl}" class="btn">View Team →</a>` : ''}
    `,
      `You joined ${data.teamName}`,
    ),

  staffInvited: (data: {
    name: string;
    orgName: string;
    inviteUrl: string;
    expiresIn: string;
  }) =>
    layout(
      `
      <p class="greeting">Staff Invitation 📋</p>
      <p class="message">
        Hi <strong>${data.name}</strong>,<br>
        You have been invited to join <strong>${data.orgName}</strong> as a staff member.
        This invitation expires in <strong>${data.expiresIn}</strong>.
      </p>
      <a href="${data.inviteUrl}" class="btn">Accept Invitation →</a>
      <hr class="divider">
      <p class="message" style="font-size:12px;color:#999;">
        If you did not expect this invitation, you can safely ignore this email.
      </p>
    `,
      `Invitation to join ${data.orgName}`,
    ),

  registrationSubmitted: (data: {
    name: string;
    referenceNumber: string;
    orgName: string;
    expectedDate?: string;
  }) =>
    layout(
      `
      <p class="greeting">Registration Received</p>
      <p class="message">
        Hi <strong>${data.name}</strong>, we have received your registration for
        <strong>${data.orgName}</strong>.
      </p>
      <div class="info-box">
        <div class="info-row"><span class="label">Reference #</span><span class="value">${data.referenceNumber}</span></div>
        ${data.expectedDate ? `<div class="info-row"><span class="label">Expected By</span><span class="value">${data.expectedDate} (7pm CST)</span></div>` : ''}
      </div>
      <p class="message">
        Our team will process your registration and send you a link when it is ready.
      </p>
    `,
      `Registration received: ${data.referenceNumber}`,
    ),

  exportCompleted: (data: {
    name: string;
    fileName: string;
    totalRecords: number;
    downloadUrl?: string;
  }) =>
    layout(
      `
      <p class="greeting">Export Ready 📊</p>
      <p class="message">Hi <strong>${data.name}</strong>, your export is ready.</p>
      <div class="info-box">
        <div class="info-row"><span class="label">File</span>    <span class="value">${data.fileName}</span></div>
        <div class="info-row"><span class="label">Records</span><span class="value">${data.totalRecords}</span></div>
      </div>
      ${data.downloadUrl ? `<a href="${data.downloadUrl}" class="btn">Download File →</a>` : ''}
    `,
      `Your export file is ready: ${data.fileName}`,
    ),

  contractExpiring: (data: {
    name: string;
    playerName: string;
    teamName: string;
    expiryDate: string;
    daysLeft: number;
  }) =>
    layout(
      `
      <p class="greeting">Contract Expiring Soon ⚠️</p>
      <p class="message">
        Hi <strong>${data.name}</strong>,<br>
        The contract for <strong>${data.playerName}</strong> at
        <strong>${data.teamName}</strong> is expiring soon.
      </p>
      <div class="info-box">
        <div class="info-row"><span class="label">Player</span>    <span class="value">${data.playerName}</span></div>
        <div class="info-row"><span class="label">Team</span>      <span class="value">${data.teamName}</span></div>
        <div class="info-row"><span class="label">Expires</span>   <span class="value">${data.expiryDate}</span></div>
        <div class="info-row"><span class="label">Days Left</span> <span class="value" style="color:#E74C3C;">${data.daysLeft} days</span></div>
      </div>
    `,
      `Contract expiring: ${data.playerName} (${data.daysLeft} days)`,
    ),

  systemAnnouncement: (data: {
    name: string;
    subject: string;
    message: string;
    actionUrl?: string;
    actionLabel?: string;
  }) =>
    layout(
      `
      <p class="greeting">📢 ${data.subject}</p>
      <p class="message">${data.message}</p>
      ${data.actionUrl ? `<a href="${data.actionUrl}" class="btn">${data.actionLabel ?? 'Learn More'} →</a>` : ''}
    `,
      data.subject,
    ),
};
