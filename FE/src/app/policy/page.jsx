// policy.jsx
"use client";
import React from "react";

const Policy = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto bg-white overflow-hidden">
        <div className="p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-[#0F9996] mb-2">
              CredLend Terms and Conditions of Use
            </h1>
            <p className="text-gray-600">
              Last Updated: {new Date().toLocaleDateString()}
            </p>
          </div>

          {/* Content */}
          <div className="prose prose-sm max-w-none text-gray-700 space-y-6">
            <p>
              Welcome to <strong className="text-[#0F9996]">CredLend</strong>, a decentralized peer-to-peer
              lending protocol designed to make digital asset lending safe,
              accessible, and borderless. By connecting your wallet and using
              CredLend, you agree to these Terms and Conditions (“Terms”). If you
              disagree, do not use or access the protocol.
            </p>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                1. About CredLend
              </h2>
              <p>
                CredLend provides a non-custodial Web3 protocol that enables
                users globally to lend, borrow, or stake digital assets directly
                through smart contracts. We do not hold user funds, private
                keys, or perform custody of any assets. All transactions occur
                on-chain and are controlled solely by the user.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                2. Acceptance of Terms
              </h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Have read and understood these Terms</li>
                <li>Are at least 18 years of age</li>
                <li>Comply with your local digital asset and financial regulations</li>
                <li>Use the platform lawfully and responsibly</li>
              </ul>
              <p>
                Your continued use constitutes acceptance of the latest version
                of these Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                3. Nature of the Service
              </h2>
              <p>CredLend operates through autonomous smart contracts that:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Enable users to deposit digital assets as collateral</li>
                <li>Access stablecoin loans or other token-based liquidity</li>
                <li>Earn yields by lending assets to the pool</li>
                <li>Enforce automatic liquidation if collateral value drops below threshold levels</li>
              </ul>
              <p>
                No central party guarantees returns or repayments; all
                transactions are governed by code, transparency, and blockchain
                logic.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                4. Global Access & Regulatory Compliance
              </h2>
              <p>
                CredLend is accessible worldwide but may be restricted in
                certain jurisdictions due to legal limitations on digital asset
                lending. You are responsible for ensuring that your use complies
                with the laws of your region.
              </p>
              <p>
                You may not use CredLend if you are located in or a resident of
                countries under financial sanctions, including (but not limited
                to) Iran, North Korea, Cuba, Syria, or regions under OFAC or UN
                embargoes.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                5. User Responsibilities
              </h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Connect only your own wallet(s) and maintain full control of private keys</li>
                <li>Ensure the safety of your assets, passwords, and devices</li>
                <li>Understand that CredLend cannot reverse transactions, recover funds, or access your wallet</li>
                <li>Refrain from hacking, exploiting, or manipulating the protocol or its code</li>
                <li>Use CredLend only for legitimate and lawful activities</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                6. Lending & Borrowing Terms
              </h2>
              <ul className="list-disc list-inside space-y-1">
                <li>
                  <strong>Collateral:</strong> Borrowers must deposit accepted
                  digital assets as collateral.
                </li>
                <li>
                  <strong>Liquidation:</strong> When collateral value falls below
                  required thresholds, the protocol automatically triggers
                  liquidation.
                </li>
                <li>
                  <strong>Interest & Fees:</strong> Interest rates and service
                  fees are algorithmically determined and transparently shown
                  before each transaction.
                </li>
                <li>
                  <strong>Late Repayment:</strong> May attract penalty fees or
                  enforced liquidation per smart contract rules.
                </li>
                <li>
                  <strong>Staking:</strong> Users may stake assets to earn yield
                  under applicable staking pools.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                7. Fees
              </h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Protocol Fees: Small percentage on transactions or interest spreads</li>
                <li>Network Fees: Blockchain gas fees</li>
                <li>Service Fees: For premium or partner integrations (where applicable)</li>
              </ul>
              <p>
                All applicable fees are disclosed before transaction confirmation.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                8. Non-Custodial Disclaimer
              </h2>
              <ul className="list-disc list-inside space-y-1">
                <li>CredLend is fully non-custodial</li>
                <li>We do not store, manage, or recover digital assets</li>
                <li>You maintain 100% control and responsibility over your funds</li>
                <li>
                  Any loss due to wallet mismanagement, phishing, or private key
                  exposure is solely the user’s responsibility
                </li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                9. Risk Disclosure
              </h2>
              <ul className="list-disc list-inside space-y-1">
                <li>Smart contract bugs or exploits</li>
                <li>Volatility in digital asset values</li>
                <li>Network congestion or failed transactions</li>
                <li>Regulatory changes affecting access to digital asset services</li>
                <li>Total or partial loss of funds due to liquidation or market collapse</li>
              </ul>
              <p>
                You use the platform entirely at your own risk.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                10. No Financial or Investment Advice
              </h2>
              <p>
                CredLend provides a protocol, not financial guidance. Information
                on the app or website is for educational and functional purposes
                only. Users should conduct independent due diligence and consult
                qualified advisors before making financial decisions.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                11. AML / KYC / Compliance
              </h2>
              <p>
                While CredLend itself is decentralized and non-custodial, certain
                integrations (e.g., fiat on-ramps, partner lenders, or off-chain
                settlement services) may require KYC/AML verification to comply
                with global financial standards.
              </p>
              <p>Users agree not to use the platform for:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>Money laundering, fraud, or terrorist financing</li>
                <li>Sanctions evasion or other illegal activities</li>
              </ul>
              <p>
                Suspicious activity may be restricted or reported to competent
                authorities.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                12. Intellectual Property
              </h2>
              <p>
                All branding, protocol designs, logos, interfaces, and
                documentation belong to CredLend Labs or its licensors. You may
                not copy, fork, or modify without explicit written consent,
                except where open-source licenses permit.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                13. Limitation of Liability
              </h2>
              <p>
                To the maximum extent permitted by law, CredLend, its team,
                partners, and affiliates shall not be liable for any indirect,
                incidental, or consequential damages. This includes loss of
                funds, profits, or data from protocol usage. Our total liability
                shall not exceed the total fees paid by the user to CredLend
                within the last 30 days.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                14. Termination & Suspension
              </h2>
              <p>
                CredLend reserves the right to restrict access or suspend
                services to any wallet or region that violates these Terms,
                applicable laws, or protocol integrity. Users may disconnect
                their wallet at any time.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                15. Updates to Terms
              </h2>
              <p>
                CredLend may update these Terms to reflect protocol upgrades,
                legal requirements, or market conditions. The latest version will
                always be available on the official website or app. Continued use
                after changes means you accept the new Terms.
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold text-[#0F9996] mb-3">
                16. Governing Law & Jurisdiction
              </h2>
              <p>
                These Terms shall be governed by the laws of the Cayman Islands /
                British Virgin Islands. Any disputes shall be resolved under
                international arbitration in accordance with UNCITRAL Rules,
                unless otherwise required by law.
              </p>
            </section>

          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500 text-center">
              By using CredLend, you confirm understanding and acceptance of
              these Terms and Conditions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Policy;
