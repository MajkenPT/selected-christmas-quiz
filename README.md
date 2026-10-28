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

## Christmas book (`/book`)

"Elf & Order", a virtual Christmas book with a 3D page turn. One episode per weekday from 1 December; the link is the same every day, the book unlocks the next chapter at 07:00 Danish time.

- **Text** – `api/_story.js`. Edit the story there. It lives on the server, so locked chapters are never sent to the browser. The parser is in `api/book.js`.
- **Unlock times** – the date in each `## DECEMBER 1 · EPISODE 01` heading, at `UNLOCK_TIME` in `api/book.js`.
- **Pictures** – `book/img/ep01.jpg` … `ep13.jpg`, see `book/IMAGE-PROMPTS.md`. A placeholder is shown until the file exists.
- **Preview a day** – `/book?date=2026-12-09&key=<ADMIN_TOKEN>` pretends it is that day (same token as `/admin`).
- **Mail** – the book does not send mail. Send the `/book` link each morning (a scheduled mail in Outlook is enough).
