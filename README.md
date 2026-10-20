# selected-christmas-quiz

Christmas quiz for Selected. Three Wednesdays in December, one question each.

- **Screen (`/`)** – runs on an iPad/TV. Counts down to the next question; when it opens it shows the question and a QR code.
- **Answer page (`/answer`)** – opened by scanning the QR code with a phone. One guess per email, no edits.
- **Schedule and questions** – `quiz-config.js` (shared by the page and the API).
- **Admin** – the `···` in the footer, code `1234`: jump between states, preview prizes. Convenience only, not security.

## Backend (answers)

Answers are stored by `api/answer.js` in a Redis/KV store reached over REST. In Vercel add the **Upstash Redis** (Storage / Marketplace) integration to the project; it sets `KV_REST_API_URL` and `KV_REST_API_TOKEN`.

To read the answers, set an `ADMIN_TOKEN` environment variable (a long random password) and open **`/admin`**. Paste the token, pick a question and load the answers. From there you can download a CSV, copy emails, and mark winners (at random, or the closest guesses to a correct answer).

The draw is made on that page; the winner emails are sent by hand.
