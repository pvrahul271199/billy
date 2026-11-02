import type { Preview } from "@storybook/react-vite";
import "../app/globals.css";

const preview: Preview = {
  parameters: {
    layout: "centered",
    backgrounds: { disable: true },
    controls: { expanded: true },
  },
  decorators: [
    (Story) => (
      <div className="w-[340px] bg-bg p-4">
        <Story />
      </div>
    ),
  ],
};
export default preview;
