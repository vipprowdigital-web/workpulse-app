import { Resend } from "resend";

export const sendEmail = async (to, subject, html) => {
  try {
    // const resend = new Resend(process.env.RESEND_API_KEY); // 👈 yaha shift

    // await resend.emails.send({
    //   from: "onboarding@resend.dev",
    //   to:"vipintiwari.dm@gmail.com",
    //   subject,
    //   html: html,
    // });

  } catch (error) {
    console.log("Email Error:", error);
  }
};