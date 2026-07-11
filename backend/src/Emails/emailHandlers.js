import { resendCLient,sender  } from "../lib/resend.js";
import { createWelcomeEmailTemplate } from "./emailTemplates.js";

export const sendWelcomeEmail = async (email,name,clientUrl) => {
const {data,error} = await resendCLient.emails.send({

    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Welcome to Chatify!",
    html: createWelcomeEmailTemplate(name,clientUrl), 
});

if(error ) {
    console.error("error sending welcome email" , error);
    throw new Error ("failed to send welcome email");

}

console.log("Welcome Email sent successfully", data);
};
