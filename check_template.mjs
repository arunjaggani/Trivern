import fs from "fs";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

const token = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

// The phone ID is an endpoint node. The templates are on the WhatsApp Business Account (WABA).
// To get the WABA ID, we can query the phone ID first.
async function checkTemplate() {
    try {
        console.log("Checking token:", token ? "Exists" : "Missing");
        console.log("Checking phoneId:", phoneId ? "Exists" : "Missing");

        const res1 = await fetch(`https://graph.facebook.com/v19.0/${phoneId}?fields=whatsapp_business_account`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data1 = await res1.json();
        const wabaId = data1.whatsapp_business_account?.id;
        console.log("WABA ID:", wabaId);

        if (!wabaId) {
            console.log("Could not get WABA ID:", data1);
            return;
        }

        const res2 = await fetch(`https://graph.facebook.com/v19.0/${wabaId}/message_templates?name=trivetn_booking`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        const data2 = await res2.json();
        console.log("Template details:", JSON.stringify(data2, null, 2));

    } catch (e) {
        console.error(e);
    }
}

checkTemplate();
