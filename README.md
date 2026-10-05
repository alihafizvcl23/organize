# Stem & Tafel — Voice-agent dashboard

English-language dashboard for orders, table reservations, Vapi call reports, and menu management. Supabase Auth protects the app; Supabase stores its data; n8n handles Vapi function calls.

## 1. Configure Supabase

1. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`. The legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY` is also supported.
2. In the Supabase SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql). It creates `menu_items`, `orders`, `bookings`, and `calls`, enables row-level security, grants authenticated staff access, and enables Realtime for orders and reservations.
3. In **Authentication → Users**, create or confirm a staff user.
4. Start the app with `npm run dev`, visit http://localhost:3000, and sign in. Use the Menu page to add menu items; the Vapi agent reads available items from that table.

The SQL script is safe to run again for this app's schema. It does not seed sample menu data or replace existing tables. If an existing table has a different schema, review and migrate it before running the script.
For a disposable test menu, optionally run [`supabase/seed.sql`](./supabase/seed.sql) after the schema. The sample prices and products are fictitious; delete or replace them before using the agent for real orders.

## 2. Import the n8n workflow

1. Import [`n8n/voice-agent-workflow.json`](./n8n/voice-agent-workflow.json) into your n8n instance.
2. Create n8n project variables (available to Code nodes as `$vars`):

   | Variable | Value |
   | --- | --- |
   | `SUPABASE_URL` | Your Supabase project URL |
   | `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key; store only in n8n |
   | `VAPI_WEBHOOK_SECRET` | A long, random token used to authenticate Vapi webhooks |

3. Save the workflow, activate it, and copy its **production** webhook URL. It ends in `/webhook/vapi-server`; do not use `/webhook-test/` for a live Vapi assistant.
4. In `.env.local`, set `NEXT_PUBLIC_N8N_VAPI_SERVER_URL` to that production URL and restart Next.js. This value is only displayed in Settings and is not an authentication secret.

The workflow accepts Vapi `tool-calls`, `status-update`, and `end-of-call-report` messages. It serves the menu lookup, validates and saves confirmed orders/reservations, and stores call transcripts and summaries. It checks `VAPI_WEBHOOK_SECRET` against an `Authorization: Bearer …` request header. Configure the same token in Vapi **Server Configuration → Custom Credentials** and select that credential for the assistant and each function tool using this endpoint.

## 3. Configure the Vapi assistant

Create an English-language assistant in Vapi. Set its server URL to the production n8n webhook and select the custom bearer credential. Add these **Function** tools, each pointing to the same n8n URL and using the same credential:

[`n8n/vapi-function-tools.json`](./n8n/vapi-function-tools.json) contains the three Vapi Function tool request bodies. Replace `https://YOUR_N8N_HOST/webhook/vapi-server` with your production URL and create each tool in Vapi (or use the Vapi Tools API). Select the custom bearer credential in each tool's Server Settings; do not paste the token into this JSON file.

### `get_menu`

Description: Return the currently available menu items and prices from Supabase.

Parameters:

```json
{"type":"object","properties":{},"required":[]}
```

### `save_order`

Description: Save an order only after the caller explicitly confirms the full order and total. Never call before confirmation.

Parameters:

```json
{
  "type": "object",
  "properties": {
    "confirmed": {"type": "boolean"},
    "confirmed_total": {"type": "number", "description": "Total in euros confirmed by the caller"},
    "customer_name": {"type": "string"},
    "type": {"type": "string", "enum": ["pickup", "delivery"]},
    "address": {"type": "string"},
    "items": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "name": {"type": "string"},
          "quantity": {"type": "integer"}
        },
        "required": ["name", "quantity"]
      }
    },
    "notes": {"type": "string"}
  },
  "required": ["confirmed", "confirmed_total", "type", "items"]
}
```

### `save_booking`

Description: Save a reservation only after the caller explicitly confirms all reservation details.

Parameters:

```json
{
  "type": "object",
  "properties": {
    "confirmed": {"type": "boolean"},
    "customer_name": {"type": "string"},
    "date": {"type": "string", "description": "Reservation date in YYYY-MM-DD format"},
    "time": {"type": "string", "description": "Reservation time in HH:MM format"},
    "party_size": {"type": "integer"},
    "notes": {"type": "string"}
  },
  "required": ["confirmed", "customer_name", "date", "time", "party_size"]
}
```

Use English for the assistant's first message and instructions. A starting prompt:

> You are the friendly English-speaking phone assistant for Stem & Tafel. Keep replies clear and brief. Call `get_menu` before quoting items, prices, or availability, and only offer items returned as available. For an order, collect the customer's name, pickup or delivery choice, and all item names and quantities. For delivery, collect the full address. Calculate the total from the returned menu prices, read back every detail and the total, then wait for explicit confirmation before calling `save_order` with `confirmed: true` and the exact `confirmed_total`. If the tool says the total changed, read back the new total and ask for confirmation again. For a reservation, collect the guest's name, date (YYYY-MM-DD), time (24-hour HH:MM), and party size. Read back all details and wait for explicit confirmation before calling `save_booking` with `confirmed: true`. If a tool reports an error, explain that it was not saved and ask how the caller wants to proceed. Never claim an order or reservation was saved unless its tool succeeds. Speak English throughout.

Set the assistant's server URL and select the custom credential to receive call status and end-of-call reports. The tools each have their own server URL setting, so select the credential on each tool as well.

### Phone number

A made-up number cannot receive calls. Add or import a real, routable number through Vapi **Phone Numbers**, assign the assistant, and select the same server URL/credential if number-level server settings are used. Vapi may provide eligible test numbers depending on account and region. To test without a phone number, use Vapi's web-call feature if enabled for your account.

## Local development and deployment

- Install dependencies: `npm install`
- Run locally: `npm run dev`
- Production build check: `npm run build`
- In Vercel, set the two Supabase public variables and `NEXT_PUBLIC_N8N_VAPI_SERVER_URL`.
- Never put the Supabase service-role key or Vapi webhook token in a `NEXT_PUBLIC_*` variable, browser code, or a committed file.

Call recordings and transcripts may contain personal data. Configure recording and retention in Vapi in line with your privacy requirements.
