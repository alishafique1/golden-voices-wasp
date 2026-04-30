import daBoiAvatar from "../client/static/da-boi.webp";
import { DocsUrl } from "../shared/common";
import type { GridFeature } from "./components/FeaturesGrid";

export const features: GridFeature[] = [
  {
    name: "AI-Powered Daily Calls",
    description: "Our AI calls your loved one every day at a time you choose, providing warm and natural conversations.",
    emoji: "📞",
    href: DocsUrl,
    size: "large",
  },
  {
    name: "Multi-Language Support",
    description: "Calls available in English, Urdu, and Hindi to suit your family's preferred language.",
    emoji: "🌐",
    href: DocsUrl,
    size: "small",
  },
  {
    name: "Family Dashboard",
    description: "See all your loved ones in one place. Track their mood, health trends, and call history at a glance.",
    emoji: "👨‍👩‍👧",
    href: DocsUrl,
    size: "medium",
  },
  {
    name: "Mood & Health Insights",
    description: "After each call, receive a summary of your loved one's mood, energy level, and any health concerns noted.",
    emoji: "💚",
    href: DocsUrl,
    size: "medium",
  },
  {
    name: "Easy Setup",
    description: "No smartphone required for your loved one. Our AI calls any phone number they already have.",
    emoji: "📱",
    href: DocsUrl,
    size: "small",
  },
  {
    name: "Cancel Anytime",
    description: "No contracts or commitment. Cancel your subscription with one click, no questions asked.",
    emoji: "🔒",
    href: DocsUrl,
    size: "small",
  },
];

export const testimonials = [
  {
    name: "Ayesha R.",
    role: "Daughter in Toronto, calls her mother in Lahore",
    avatarSrc: daBoiAvatar,
    socialUrl: "",
    quote: "My mother looks forward to her daily call every morning. The Urdu support means she gets a genuine conversation, not just a voice assistant. I finally have peace of mind.",
  },
  {
    name: "James T.",
    role: "Son in Chicago, checks in on his father in Karachi",
    avatarSrc: daBoiAvatar,
    socialUrl: "",
    quote: "The call summaries are incredibly helpful. I can see my father's mood trends over time and know immediately if something seems off. It's like having a daily health check-in without the intrusion.",
  },
  {
    name: "Priya M.",
    role: "Granddaughter in London, calls grandparents in Delhi",
    avatarSrc: daBoiAvatar,
    socialUrl: "",
    quote: "Setting it up took less than 5 minutes. My grandparents don't need a smartphone — just their regular phone. The AI calls them like a caring family member would.",
  },
];

export const faqs = [
  {
    id: 1,
    question: "How does the AI calling service work?",
    answer: "You select a phone number for your loved one, choose a daily call time, and set your language preference. Our AI will call at the scheduled time and have a natural conversation. After each call, you'll receive a mood and health summary via the family dashboard.",
    href: "#faq",
  },
  {
    id: 2,
    question: "What languages are supported?",
    answer: "Currently, Golden Voices Connect supports English, Urdu, and Hindi. We're working on adding more languages to serve families around the world.",
    href: "#faq",
  },
  {
    id: 3,
    question: "What if my parent does not have a smartphone?",
    answer: "No smartphone is needed. Our AI calls any regular phone number, landline or mobile. Your loved one simply answers the phone like any normal call.",
    href: "#faq",
  },
  {
    id: 4,
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time with no contracts or commitments. There are no cancellation fees or questions asked.",
    href: "#pricing",
  },
  {
    id: 5,
    question: "How is this different from a regular phone call?",
    answer: "Unlike a regular call, Golden Voices provides a structured daily check-in with AI-generated summaries after each call. You can track mood trends over time, catch early signs of health issues, and ensure consistency — something that's hard to maintain with manual calls.",
    href: "#faq",
  },
  {
    id: 6,
    question: "Is the AI conversation natural?",
    answer: "Yes. The AI is designed to have warm, conversational exchanges. It adapts to your loved one's pace of speech, can handle interruptions and tangents, and switches seamlessly between topics like a real phone call.",
    href: "#faq",
  },
];

export const footerNavigation = {
  app: [
    { name: "How It Works", href: "#how-it-works" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ],
  company: [
    { name: "About", href: "#about" },
    { name: "Privacy Policy", href: "#privacy" },
    { name: "Terms of Service", href: "#terms" },
    { name: "Contact", href: "mailto:hello@goldenvoices.app" },
  ],
};

export const examples = [
  {
    name: "Family Dashboard",
    description: "See all your loved ones, their mood trends, and upcoming calls at a glance.",
    imageSrc: "dashboard",
    href: "#",
  },
  {
    name: "Schedule a Call",
    description: "Set up daily AI calls in minutes. Choose the time, language, and frequency.",
    imageSrc: "schedule",
    href: "#",
  },
  {
    name: "Call Summary",
    description: "After every call, receive a mood and health summary right in your dashboard.",
    imageSrc: "summary",
    href: "#",
  },
];
