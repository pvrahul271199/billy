import { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus, Receipt } from "@phosphor-icons/react";
import { Amount, Button, Chip, EmptyState, Input, SegmentedControl, Spinner, StatusPill, Stepper, Toggle } from "@/components/ui";
import { Splash } from "@/components/screens/Screen";

const meta: Meta = { title: "Billy/Components", parameters: { layout: "centered" } };
export default meta;
type Story = StoryObj;

export const Buttons: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <Button variant="primary" fullWidth>Create invoice</Button>
      <Button variant="secondary" fullWidth>Save draft</Button>
      <Button variant="tint" fullWidth icon={Plus}>Add item</Button>
      <Button variant="ghost" fullWidth>Cancel</Button>
      <Button variant="primary" fullWidth loading>Saving</Button>
    </div>
  ),
};

export const Inputs: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Input label="Full name" placeholder="Riya Sharma" />
      <Input label="Instagram username" prefix="@" placeholder="riya.creates" />
      <Input label="IFSC" defaultValue="HDFC00012" error="IFSC needs 11 characters" />
      <Input label="PAN" defaultValue="ABCDE1234F" disabled />
    </div>
  ),
};

export const Controls: Story = {
  render: function Render() {
    const [qty, setQty] = useState(1);
    const [gst, setGst] = useState(true);
    const [type, setType] = useState("reel");
    const [chip, setChip] = useState("all");
    return (
      <div className="flex flex-col gap-5">
        <Stepper label="Qty" value={qty} onChange={setQty} />
        <Toggle label="I am GST registered" description="Adds GST and titles the document Tax Invoice" checked={gst} onChange={setGst} />
        <SegmentedControl
          label="Deliverable"
          value={type}
          onChange={setType}
          segments={[{ value: "reel", label: "Reel" }, { value: "story", label: "Story" }, { value: "post", label: "Post" }]}
        />
        <div className="flex gap-2">
          {["all", "pending", "paid"].map((c) => (
            <Chip key={c} selected={chip === c} onClick={() => setChip(c)} className="capitalize">{c}</Chip>
          ))}
        </div>
      </div>
    );
  },
};

export const StatusPills: Story = {
  render: () => (
    <div className="flex flex-wrap gap-2">
      {(["draft", "pending", "overdue", "paid"] as const).map((s) => <StatusPill key={s} status={s} />)}
    </div>
  ),
};

export const Amounts: Story = { render: () => <Amount value="₹1,45,500.00" /> };

export const Empty: Story = {
  render: () => (
    <EmptyState icon={Receipt} title="No invoices yet" description="Your first invoice will show up here." action={<Button variant="tint">New invoice</Button>} />
  ),
};

export const Loading: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Spinner size={24} className="text-ink" />
      <div className="h-64 overflow-hidden rounded-note border border-line"><Splash label="Getting your invoices" /></div>
    </div>
  ),
};
