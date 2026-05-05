const HUBSPOT_FORMS_API_BASE = "https://api.hsforms.com";
const GAME_FORM_PORTAL_ID = "21714357";
const GAME_FORM_ID = "a1b5cc85-88b0-4cb4-a551-b1d0a3feba9f";

type HubSpotFormInput = {
  email: string;
  displayName: string;
  pageUri?: string;
};

export async function submitGameFormToHubSpot(input: HubSpotFormInput) {
  const res = await fetch(
    `${HUBSPOT_FORMS_API_BASE}/submissions/v3/integration/submit/${GAME_FORM_PORTAL_ID}/${GAME_FORM_ID}`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        submittedAt: Date.now(),
        fields: [
          { name: "email", value: input.email.toLowerCase() },
          { name: "firstname", value: input.displayName },
        ],
        context: {
          pageName: "Bloom Catcher",
          pageUri: input.pageUri || process.env.NEXT_PUBLIC_SITE_URL || "https://bloom-catcher.local",
        },
      }),
    }
  );

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`HubSpot form ${res.status} ${res.statusText}: ${detail}`);
  }
}
