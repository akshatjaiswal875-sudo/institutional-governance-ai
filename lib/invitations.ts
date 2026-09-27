type MeetingInvitation = {
  recipientEmail: string;
  recipientName: string;
  meetingTitle: string;
  date: string;
  organizer: string;
  location: string | null;
  agenda: string[];
};

export async function sendMeetingInvitation(invitation: MeetingInvitation): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;
  if (!apiKey || !from) {
    throw new Error("Email invitations are not configured. Set RESEND_API_KEY and RESEND_FROM_EMAIL on the server.");
  }

  const agenda = invitation.agenda.length ? invitation.agenda.map(item => `- ${item}`).join("\n") : "No agenda has been added yet.";
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [invitation.recipientEmail],
      subject: `Meeting invitation: ${invitation.meetingTitle}`,
      text: [
        `Hello ${invitation.recipientName || invitation.recipientEmail},`,
        "",
        `You are invited to ${invitation.meetingTitle}.`,
        `Date and time: ${invitation.date}`,
        `Organizer: ${invitation.organizer}`,
        `Location or meeting link: ${invitation.location || "Not specified"}`,
        "",
        "Agenda:",
        agenda,
      ].join("\n"),
    }),
  });

  if (!response.ok) {
    throw new Error(`Invitation email failed with status ${response.status}.`);
  }
}
