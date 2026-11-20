import { Link } from "react-router-dom";
import { LegalLayout, Email } from "./LegalLayout";
import { SITE } from "../../lib/site";

// Plain-language Terms of Service for a free SaaS run by an individual in
// India. A starting point, not legal advice — have a lawyer review it
// before relying on it.
const sections = [
  {
    id: "agreement",
    title: "Agreeing to these terms",
    body: (
      <>
        <p>
          These Terms of Service (“Terms”) are an agreement between you and {SITE.legalName} (“WareSync”, “we”, “us”), and they
          cover your use of the WareSync website and app (the “Service”). By creating a workspace, signing in, or using the
          Service, you agree to these Terms and to our <Link to="/privacy">Privacy Policy</Link>. If you don't agree, please
          don't use the Service.
        </p>
        <p>
          If you sign up for a business, you confirm that you're allowed to accept these Terms on its behalf, and “you” then
          also means that business.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Who can use WareSync",
    body: (
      <p>
        You must be at least 18 years old and able to enter into a binding contract under Indian law to create a workspace.
        Employees added by an admin must also be 18 or older, or be using the Service under the supervision and responsibility
        of the admin who added them.
      </p>
    ),
  },
  {
    id: "accounts",
    title: "Workspaces and accounts",
    body: (
      <>
        <p>
          Each workspace belongs to the business that created it. The person who creates it is its <strong>admin</strong> and
          controls it: they can add and remove employees, reset employee passwords, change or delete stock data, and delete
          the whole workspace.
        </p>
        <ul>
          <li>Keep your password and your company code to yourselves and the people who need them.</li>
          <li>You're responsible for everything done through accounts in your workspace, including by employees you add.</li>
          <li>Give accurate information when you sign up, and keep your email address up to date so you can recover your account.</li>
          <li>Tell us straight away at <Email /> if you think someone has accessed your account without permission.</li>
        </ul>
      </>
    ),
  },
  {
    id: "your-data",
    title: "Your data",
    body: (
      <>
        <p>
          Everything you put into WareSync — items, quantities, warehouses, party names, requests and logs (“Your Data”) — stays
          yours. You give us permission to store, process and display Your Data only as needed to run the Service for you, keep
          it secure, and fix problems. We don't sell Your Data or use it for advertising.
        </p>
        <p>
          You're responsible for Your Data: that it's accurate, that you have the right to record it (including any personal
          details of customers, suppliers or staff), and that recording it is lawful. When you enter personal details about
          other people, you act as the party responsible for that data and we handle it on your instructions, as described in
          our <Link to="/privacy">Privacy Policy</Link>.
        </p>
        <p>
          You can export your stock and activity logs to Excel at any time. If you delete your workspace, Your Data is deleted
          permanently and cannot be recovered, so export anything you need first.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul>
          <li>use the Service for anything illegal, including recording the sale of goods you're not allowed to sell;</li>
          <li>try to access another company's workspace or data, or any account that isn't yours;</li>
          <li>probe, scan or test the Service for vulnerabilities, or get around its security or rate limits, without our written permission;</li>
          <li>overload, disrupt or attack the Service, or use bots to create accounts or send requests in bulk;</li>
          <li>upload malware or anything that infringes someone else's rights;</li>
          <li>resell or rent out the Service, or copy it to build a competing product.</li>
        </ul>
        <p>
          Found a security issue? Please report it privately to <Email /> — we appreciate responsible disclosure.
        </p>
      </>
    ),
  },
  {
    id: "not-advice",
    title: "WareSync is a record-keeping tool, not advice",
    body: (
      <>
        <p>
          WareSync helps you record and view stock movements. Its figures — stock levels, daily opening and closing stock,
          reports and exports — are calculated only from the entries made in your workspace. They are not an audit, a
          valuation, or accounting, tax, GST or legal advice.
        </p>
        <p>
          Check important figures against your own books and physical stock before relying on them for business, tax or legal
          decisions. Low-stock alerts are a convenience and may be delayed or missed; don't rely on them alone.
        </p>
      </>
    ),
  },
  {
    id: "service",
    title: "The Service, changes and availability",
    body: (
      <>
        <p>
          WareSync is currently offered free of charge. We work to keep it running and your data safe, but we don't promise it
          will always be available, uninterrupted or error-free. It may be unavailable during maintenance, outages of our
          hosting providers, or events outside our control.
        </p>
        <p>
          We may add, change or remove features. If we ever plan to charge for the Service, we'll tell you in advance and you
          won't be charged unless you agree. If we decide to shut the Service down, we'll give you at least 30 days' notice
          by email where we can, so you can export your data.
        </p>
      </>
    ),
  },
  {
    id: "third-parties",
    title: "Third-party services",
    body: (
      <p>
        Some features rely on other companies — for example, “Continue with Google” uses Google's sign-in, and account emails
        are delivered by an email provider. Your use of those services is also subject to their own terms. We're not
        responsible for services we don't control.
      </p>
    ),
  },
  {
    id: "ip",
    title: "Our intellectual property",
    body: (
      <p>
        The WareSync name, logo, software and website content belong to us. These Terms give you a limited, non-exclusive,
        non-transferable right to use the Service for your business while you follow them — nothing else. If you send us
        feedback or ideas, we may use them freely without owing you anything.
      </p>
    ),
  },
  {
    id: "termination",
    title: "Ending your use",
    body: (
      <>
        <p>
          You can stop using WareSync at any time. An admin can delete the whole workspace from <strong>Settings → Danger
          Zone</strong>; an admin can remove employee accounts from the Team page.
        </p>
        <p>
          We may suspend or close an account or workspace that breaks these Terms, puts other users or the Service at risk,
          or where the law requires it. Where it's reasonable and lawful, we'll tell you first and give you a chance to export
          your data. We may delete workspaces that have been inactive for more than 24 months, after emailing the admin at least
          30 days beforehand.
        </p>
      </>
    ),
  },
  {
    id: "disclaimer",
    title: "Disclaimer",
    body: (
      <p>
        To the extent the law allows, the Service is provided <strong>“as is” and “as available”</strong>, without warranties of
        any kind, whether express or implied, including warranties of merchantability, fitness for a particular purpose,
        accuracy and non-infringement.
      </p>
    ),
  },
  {
    id: "liability",
    title: "Limitation of liability",
    body: (
      <>
        <p>To the extent the law allows:</p>
        <ul>
          <li>
            we won't be liable for indirect, incidental, special or consequential losses, or for lost profits, revenue,
            goodwill, stock or data, arising from your use of (or inability to use) the Service;
          </li>
          <li>
            our total liability for any claim relating to the Service is limited to the amount you paid us for the Service in
            the 12 months before the claim, or ₹1,000 if you paid nothing.
          </li>
        </ul>
        <p>Nothing in these Terms limits liability that can't be limited by law, such as liability for fraud.</p>
      </>
    ),
  },
  {
    id: "indemnity",
    title: "Indemnity",
    body: (
      <p>
        You agree to compensate us for reasonable losses and costs (including legal fees) arising from a claim by someone else
        about Your Data or your breach of these Terms.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to these terms",
    body: (
      <p>
        We may update these Terms. If a change is significant, we'll tell you in the app or by email before it takes effect,
        and you'll be asked to accept the new version the next time you sign in. If you don't agree, you can stop using the
        Service and delete your workspace.
      </p>
    ),
  },
  {
    id: "law",
    title: "Governing law and disputes",
    body: (
      <p>
        These Terms are governed by the laws of India. Please contact us first — most problems can be sorted out quickly. If
        a dispute can't be resolved within 30 days, the courts at {SITE.legalCity} will have exclusive jurisdiction.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact and grievances",
    body: (
      <>
        <p>
          Questions or complaints about the Service or these Terms: <Email />. Our Grievance Officer is {SITE.legalName},
          reachable at the same address. We'll acknowledge complaints within 24 hours and aim to resolve them within 15 days.
        </p>
        <p>
          If any part of these Terms is found unenforceable, the rest still applies. Not enforcing a right straight away
          doesn't mean we've given it up. These Terms and the Privacy Policy are the whole agreement between us about the Service.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalLayout
      title="Terms of Service"
      intro={
        <p>
          Plain-language summary: WareSync is a free tool for recording stock. Your data is yours, keep your login safe, use it
          lawfully, and double-check important numbers — WareSync is a record-keeping tool, not accounting or tax advice. The full
          terms below are what apply.
        </p>
      }
      sections={sections}
    />
  );
}
