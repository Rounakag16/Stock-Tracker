import { Link } from "react-router-dom";
import { LegalLayout, Email } from "./LegalLayout";
import { SITE } from "../../lib/site";

// Privacy Policy written for India's Digital Personal Data Protection Act,
// 2023, and the IT (Reasonable Security Practices…) Rules, 2011. Keep it in
// step with what the app actually does — every cookie, provider and
// retention period listed here should be true.
const sections = [
  {
    id: "who",
    title: "Who we are",
    body: (
      <p>
        WareSync is operated by {SITE.legalName}, {SITE.country} (“we”, “us”). For your account details we decide how and why
        they're used, so we're responsible for them (a “Data Fiduciary” under India's Digital Personal Data Protection Act,
        2023). Contact us any time at <Email />.
      </p>
    ),
  },
  {
    id: "collect",
    title: "What we collect",
    body: (
      <>
        <p><strong>Account details</strong></p>
        <ul>
          <li>Admins: name, email address, and business name.</li>
          <li>Employees: the username and temporary password their admin sets up. Employees don't need to give us an email.</li>
          <li>Passwords are stored only as a salted bcrypt hash — we can't see them.</li>
          <li>If you use “Continue with Google”: your Google account ID, name and verified email address. We don't get your Google password or access to your Gmail, contacts or files.</li>
          <li>The date you accepted these terms, and when you last signed in.</li>
        </ul>
        <p><strong>Workspace data you enter</strong></p>
        <ul>
          <li>Items, quantities, warehouses, tags, stock requests, notes, activity logs, and party names (customers, suppliers) attached to entries, plus spreadsheets you upload.</li>
        </ul>
        <p><strong>Technical data</strong></p>
        <ul>
          <li>IP address, browser and device type, and request logs, kept by us and our hosting provider to run the Service, stop abuse (such as password-guessing) and fix problems.</li>
        </ul>
        <p>We don't collect payment details, government IDs, precise location, or use any advertising or analytics trackers.</p>
      </>
    ),
  },
  {
    id: "use",
    title: "How we use it",
    body: (
      <>
        <ul>
          <li>to create and run your workspace and let you and your team sign in;</li>
          <li>to send account emails: confirming your email, password resets, and security notices like “your password was changed”;</li>
          <li>to keep the Service secure — rate-limiting sign-ins, detecting abuse, and checking new passwords against known data breaches;</li>
          <li>to answer support requests, and to meet legal obligations.</li>
        </ul>
        <p>
          We use your data on the basis of the consent you give when you sign up, and for the “legitimate uses” the DPDP Act
          allows, such as providing a service you asked for and complying with law. We don't sell personal data, use it for
          advertising, or send marketing emails without asking first.
        </p>
      </>
    ),
  },
  {
    id: "business-data",
    title: "Data your business enters about others",
    body: (
      <p>
        When your workspace records details about other people — like a customer's name on a sale, or an employee's username —
        your business decides what to record and why. For that data, your business is responsible as the Data Fiduciary and
        we process it only on its behalf to provide the Service. If you're a customer, supplier or employee of a business that
        uses WareSync, please contact that business first about your data; we'll help them respond.
      </p>
    ),
  },
  {
    id: "sharing",
    title: "Who we share it with",
    body: (
      <>
        <p>We share data only with service providers that help us run WareSync, under their own security and confidentiality obligations:</p>
        <ul>
          <li><strong>Render</strong> — application hosting (servers in the United States).</li>
          <li><strong>MongoDB Atlas</strong> — database hosting.</li>
          <li><strong>Brevo</strong> — delivering account emails (your email address and the message).</li>
          <li><strong>Google</strong> — “Continue with Google” sign-in, if you choose it, and web fonts, which your browser loads from Google's servers.</li>
          <li><strong>Have I Been Pwned</strong> — when you choose a password, we send only the first 5 characters of a one-way hash of it to check it against known breaches. Your password itself never leaves our server.</li>
        </ul>
        <p>
          We may also disclose data when required by law or by a lawful request from a government authority, or to protect the
          rights and safety of our users or the public. If WareSync is ever transferred to someone else, your data would move
          with it under this policy, and we'd tell you first.
        </p>
      </>
    ),
  },
  {
    id: "transfers",
    title: "Where your data is stored",
    body: (
      <p>
        Our providers store and process data on servers that may be outside India, including in the United States and the
        European Union. We only transfer data in ways permitted under Indian law, and not to any country the Government of
        India restricts.
      </p>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <ul>
        <li>Account and workspace data: for as long as the workspace exists.</li>
        <li>When an admin deletes the workspace: all of its data — users, stock, requests and logs — is deleted from our live database immediately. Copies in our providers' encrypted backups are overwritten on their normal cycle, typically within 30 days.</li>
        <li>When an admin removes an employee: the account is deleted, but past entries in the activity log stay as part of the business's records (shown as “Deleted user”).</li>
        <li>Password-reset and email-confirmation links expire after 1 hour and 24 hours.</li>
        <li>Server logs: kept by our hosting provider for a short period, typically up to 30 days.</li>
      </ul>
    ),
  },
  {
    id: "security",
    title: "How we protect it",
    body: (
      <>
        <p>
          All traffic is encrypted with HTTPS. Passwords are hashed with bcrypt and checked against known breaches. Sign-in
          sessions use secure, HTTP-only cookies, and changing your password signs out your other devices. Each company's data
          is kept separate from every other company's, sign-in attempts are rate-limited, and the app sends strict browser
          security headers.
        </p>
        <p>
          No system is perfectly secure. If a breach affects your personal data, we'll notify you and the Data Protection
          Board of India as the law requires.
        </p>
      </>
    ),
  },
  {
    id: "cookies",
    title: "Cookies and local storage",
    body: (
      <>
        <p>WareSync uses only what's strictly needed for it to work — no advertising or analytics cookies:</p>
        <ul>
          <li><strong>waresync_session</strong> (cookie, 7 days): keeps you signed in. Secure and HTTP-only.</li>
          <li><strong>Local storage</strong> on your device: your last-used company code and which sign-in tab you used, so you don't have to retype them.</li>
          <li>If you click “Continue with Google”, Google may set its own cookies under <a href="https://policies.google.com/privacy" target="_blank" rel="noreferrer">Google's Privacy Policy</a>.</li>
        </ul>
        <p>Because these are essential, there's no cookie banner. Blocking them will stop sign-in from working.</p>
      </>
    ),
  },
  {
    id: "rights",
    title: "Your rights",
    body: (
      <>
        <p>Under the DPDP Act you can:</p>
        <ul>
          <li>ask for a summary of the personal data we hold about you and how we use it;</li>
          <li>correct or update it — admins can change their email and password in Settings;</li>
          <li>have it erased — an admin can delete the whole workspace in Settings, or email us;</li>
          <li>withdraw consent (which means closing your account, since we need your data to provide the Service);</li>
          <li>nominate someone to exercise these rights for you if you die or become unable to;</li>
          <li>raise a grievance with us, and if you're not satisfied with our answer, complain to the Data Protection Board of India.</li>
        </ul>
        <p>Email <Email /> to use any of these. We may need to confirm your identity first, and we'll reply within 30 days.</p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        WareSync is a business tool for adults. We don't knowingly collect data from anyone under 18. If you believe a child has
        signed up, contact us and we'll delete the account.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        If we change this policy in a meaningful way, we'll update the date above and ask you to review and accept the new
        version in the app. The <Link to="/terms">Terms of Service</Link> explain how changes take effect.
      </p>
    ),
  },
  {
    id: "grievance",
    title: "Grievance Officer",
    body: (
      <p>
        In line with the Information Technology Act, 2000 and the DPDP Act, 2023, our Grievance Officer is {SITE.legalName},
        who can be reached at <Email />. We'll acknowledge your complaint within 24 hours and aim to resolve it within 15 days.
      </p>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalLayout
      title="Privacy Policy"
      intro={
        <p>
          The short version: we collect only what's needed to run your inventory workspace, we never sell it or use it for
          ads, your business's data stays separate from everyone else's, and you can delete it all whenever you like.
        </p>
      }
      sections={sections}
    />
  );
}
