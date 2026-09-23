"use client";

import QRCode from "qrcode";
import { useEffect, useState, useTransition } from "react";
import { Button, ErrorNote, Field, Modal, Select, TextInput } from "@/components/ui";
import { prepareUpload } from "@/lib/prepare-upload";
import { MAX_UPLOAD_LABEL } from "@/lib/upload-limits";
import { submitDeposit, submitWithdrawal } from "./request-actions";

type Wallet = { id: string; label: string; address: string };
type SavedAddress = { id: string; label: string; address: string };

const AMOUNT_RE = /^\d+(\.\d{1,2})?$/;
const MIN_DEPOSIT = 50;

function Steps({ total, current }: { total: number; current: number }) {
  return (
    <div className="mb-5 flex gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`h-1 flex-1 rounded-full ${i < current ? "bg-accent" : "bg-border"}`} />
      ))}
    </div>
  );
}

function DepositModal({ wallet, onClose }: { wallet: Wallet | null; onClose: () => void }) {
  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [qr, setQr] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!wallet) return;
    QRCode.toDataURL(wallet.address, { margin: 1, width: 224 }).then(setQr).catch(() => setQr(null));
  }, [wallet]);

  async function copy() {
    if (!wallet) return;
    try {
      await navigator.clipboard.writeText(wallet.address);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't copy automatically — select the address and copy it manually.");
    }
  }

  async function chooseFile(chosen: File | undefined) {
    setError(null);
    setFile(null);
    if (!chosen) return;
    const result = await prepareUpload(chosen);
    if (result.error || !result.file) setError(result.error ?? "Could not read that file.");
    else setFile(result.file);
  }

  function next() {
    setError(null);
    if (step === 2) {
      const value = amount.trim();
      if (!AMOUNT_RE.test(value)) {
        setError("Enter the amount you sent (up to 2 decimals).");
        return;
      }
      if (Number(value) < MIN_DEPOSIT) {
        setError(`Minimum deposit is $${MIN_DEPOSIT}.`);
        return;
      }
    }
    setStep(step + 1);
  }

  function submit() {
    if (!wallet || !file) {
      setError("Attach a screenshot of the payment.");
      return;
    }
    setError(null);
    const fd = new FormData();
    fd.set("currency", currency);
    fd.set("amount", amount.trim());
    fd.set("walletId", wallet.id);
    fd.set("proof", file);
    startTransition(async () => {
      const res = await submitDeposit(fd);
      if (res.error) setError(res.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <Modal title="Deposit submitted" onClose={onClose} footer={<Button onClick={onClose}>Done</Button>}>
        <p className="text-[13.5px] leading-relaxed text-text-dim">
          Your deposit request is with an admin for review. Your balance updates once it&apos;s
          approved — you can follow its status under Recent requests.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title="Deposit funds"
      onClose={onClose}
      footer={
        <>
          {step > 1 ? (
            <Button variant="ghost" onClick={() => { setError(null); setStep(step - 1); }}>
              Back
            </Button>
          ) : null}
          {wallet ? (
            step < 3 ? (
              <Button onClick={next}>Continue</Button>
            ) : (
              <Button onClick={submit} disabled={pending}>
                {pending ? "Submitting…" : "Submit request"}
              </Button>
            )
          ) : null}
        </>
      }
    >
      {!wallet ? (
        <p className="text-[13.5px] text-text-dim">
          Deposits aren&apos;t available yet — no deposit address has been set up. Please contact an admin.
        </p>
      ) : (
        <>
          <Steps total={3} current={step} />
          {step === 1 ? (
            <div>
              <p className="mb-3 text-[13px] text-text-dim">
                Send funds to Vaultra&apos;s TRC20 deposit address, then continue to tell us what you sent.
              </p>
              {qr ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qr} alt="Deposit address QR code" width={168} height={168} className="mx-auto rounded-lg border border-border bg-white p-1" />
              ) : null}
              <div className="mt-3 flex items-center justify-between gap-2 rounded-lg border border-border bg-surface-2 px-3 py-2.5">
                <span className="break-all font-mono text-[12px] text-text">{wallet.address}</span>
                <Button size="sm" variant="secondary" onClick={copy}>
                  {copied ? "Copied" : "Copy"}
                </Button>
              </div>
              <p className="mt-2.5 text-[11.5px] leading-relaxed text-text-faint">
                Network: TRC20 (TRON) only. Sending on any other network may result in permanent loss of funds.
              </p>
            </div>
          ) : null}
          {step === 2 ? (
            <div className="flex flex-col gap-3.5">
              <Field label="Currency">
                <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
                  <option>USDT</option>
                  <option>USDC</option>
                </Select>
              </Field>
              <Field label="Amount you sent" hint={`Must match the transfer in your screenshot. Minimum $${MIN_DEPOSIT}.`}>
                <TextInput value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 250.00" inputMode="decimal" />
              </Field>
            </div>
          ) : null}
          {step === 3 ? (
            <div>
              <p className="mb-2.5 text-[13px] text-text-dim">Upload a screenshot of the completed transfer as proof.</p>
              <label className="flex cursor-pointer flex-col items-center gap-1.5 rounded-lg border-[1.5px] border-dashed border-border px-4 py-7 text-center text-[12.5px] text-text-dim hover:border-accent hover:text-accent-ink">
                <span className="font-semibold">{file ? `✓ ${file.name}` : "Click to choose a screenshot"}</span>
                <span className="text-[11.5px] text-text-faint">Photo or PDF · up to {MAX_UPLOAD_LABEL}</span>
                <input type="file" accept="image/*,application/pdf" className="hidden" onChange={(e) => chooseFile(e.target.files?.[0])} />
              </label>
            </div>
          ) : null}
          {error ? <div className="mt-3"><ErrorNote>{error}</ErrorNote></div> : null}
        </>
      )}
    </Modal>
  );
}

function WithdrawModal({
  addresses,
  available,
  onClose,
}: {
  addresses: SavedAddress[];
  available: number;
  onClose: () => void;
}) {
  const [step, setStep] = useState(1);
  const [currency, setCurrency] = useState("USDT");
  const [amount, setAmount] = useState("");
  const [addressId, setAddressId] = useState(addresses[0]?.id ?? "");
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [pending, startTransition] = useTransition();

  function next() {
    setError(null);
    const value = amount.trim();
    if (!AMOUNT_RE.test(value) || Number(value) <= 0) {
      setError("Enter a valid amount (up to 2 decimals).");
      return;
    }
    if (Number(value) > available) {
      setError(`That's more than your available balance ($${available.toFixed(2)}).`);
      return;
    }
    setStep(2);
  }

  function submit() {
    setError(null);
    startTransition(async () => {
      const res = await submitWithdrawal({ currency, amount: amount.trim(), addressId });
      if (res.error) setError(res.error);
      else setDone(true);
    });
  }

  if (done) {
    return (
      <Modal title="Withdrawal requested" onClose={onClose} footer={<Button onClick={onClose}>Done</Button>}>
        <p className="text-[13.5px] leading-relaxed text-text-dim">
          An admin will send the funds to your chosen address and attach proof of the payout. You&apos;ll
          see the result under Recent requests.
        </p>
      </Modal>
    );
  }

  return (
    <Modal
      title="Withdraw funds"
      onClose={onClose}
      footer={
        <>
          {step > 1 ? (
            <Button variant="ghost" onClick={() => { setError(null); setStep(1); }}>
              Back
            </Button>
          ) : null}
          {step === 1 ? (
            <Button onClick={next}>Continue</Button>
          ) : (
            <Button onClick={submit} disabled={pending || !addressId}>
              {pending ? "Submitting…" : "Submit request"}
            </Button>
          )}
        </>
      }
    >
      <Steps total={2} current={step} />
      {step === 1 ? (
        <div className="flex flex-col gap-3.5">
          <Field label="Currency">
            <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
              <option>USDT</option>
              <option>USDC</option>
            </Select>
          </Field>
          <Field label="Amount to withdraw" hint={`Available: $${available.toFixed(2)}`}>
            <TextInput value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="e.g. 150.00" inputMode="decimal" />
          </Field>
        </div>
      ) : addresses.length === 0 ? (
        <p className="text-[13.5px] text-text-dim">
          You have no saved withdrawal addresses yet. Close this, add one under Saved withdrawal
          addresses, then try again.
        </p>
      ) : (
        <div>
          <p className="mb-2.5 text-[13px] text-text-dim">Choose which saved address should receive the funds.</p>
          <div className="flex flex-col gap-2">
            {addresses.map((a) => (
              <button
                key={a.id}
                type="button"
                onClick={() => setAddressId(a.id)}
                className={`rounded-lg border px-3.5 py-2.5 text-left ${
                  addressId === a.id ? "border-accent bg-accent-soft" : "border-border"
                }`}
              >
                <div className="text-[13px] font-bold text-text">{a.label}</div>
                <div className="break-all font-mono text-[11.5px] text-text-dim">{a.address}</div>
              </button>
            ))}
          </div>
        </div>
      )}
      {error ? <div className="mt-3"><ErrorNote>{error}</ErrorNote></div> : null}
    </Modal>
  );
}

export function BalanceActions({
  wallet,
  addresses,
  available,
}: {
  wallet: Wallet | null;
  addresses: SavedAddress[];
  available: number;
}) {
  const [open, setOpen] = useState<"deposit" | "withdraw" | null>(null);

  return (
    <>
      <div className="mt-4 flex flex-wrap gap-2.5">
        <Button onClick={() => setOpen("deposit")}>↑ Deposit</Button>
        <Button variant="secondary" onClick={() => setOpen("withdraw")}>
          ↓ Withdraw
        </Button>
      </div>
      {open === "deposit" ? <DepositModal wallet={wallet} onClose={() => setOpen(null)} /> : null}
      {open === "withdraw" ? (
        <WithdrawModal addresses={addresses} available={available} onClose={() => setOpen(null)} />
      ) : null}
    </>
  );
}
