import daBoiAvatar from "../client/static/da-boi.webp";
import kivo from "../client/static/examples/kivo.webp";
import messync from "../client/static/examples/messync.webp";
import microinfluencerClub from "../client/static/examples/microinfluencers.webp";
import promptpanda from "../client/static/examples/promptpanda.webp";
import reviewradar from "../client/static/examples/reviewradar.webp";
import scribeist from "../client/static/examples/scribeist.webp";
import searchcraft from "../client/static/examples/searchcraft.webp";
import { BlogUrl, DocsUrl } from "../shared/common";
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
    name: "Sarah M.",
    role: "Daughter living in Chicago",
    avatarSrc: daBoiAvatar,
    socialUrl: "",
    quote: "Golden Voices Connect gave me peace of mind. My mother in Lahore looks forward to her daily call and I love getting the mood updates.",
  },
  {
    name: "Raj K.",
    role: "Son living in London",
    avatarSrc: daBoiAvatar,
    socialUrl: "",
    quote: "The Urdu language support was a game-changer for our family. Dad prefers speaking in his native language and the AI handles it perfectly.",
  },
  {
    name: "Michael T.",
    role: "Caregiver in Toronto",
    avatarSrc: daBoiAvatar,
    socialUrl: "#",
    quote: "I manage care for several elderly clients. This service helps me stay on top of their wellbeing without being intrusive.",
  },
];

export const faqs = [
  {
    id: 1,
    question: "How does the AI calling service work?",
    answer: "You select a phone number for your loved one, choose a daily call time, and set your language preference. Our AI will call at the scheduled time and have a natural conversation. After each call, you'll receive a mood and health summary via the family dashboard.",
    href: DocsUrl,
  },
  {
    id: 2,
    question: "What languages are supported?",
    answer: "Currently, Golden Voices Connect supports English, Urdu, and Hindi. We're working on adding more languages to serve families around the world.",
    href: DocsUrl,
  },
  {
    id: 3,
    question: "What if my parent does not have a smartphone?",
    answer: "No smartphone is needed. Our AI calls any regular phone number, landline or mobile. Your loved one simply answers the phone like any normal call.",
    href: DocsUrl,
  },
  {
    id: 4,
    question: "Can I cancel my subscription anytime?",
    answer: "Yes, you can cancel your subscription at any time with no contracts or commitments. There are no cancellation fees or questions asked.",
    href: "#",
  },
];

export const footerNavigation = {
  app: [
    { name: "Documentation", href: DocsUrl },
    { name: "How It Works", href: DocsUrl },
    { name: "Pricing", href: "#" },
  ],
  company: [
    { name: "About Us", href: "#" },
    { name: "Privacy Policy", href: "#" },
    { name: "Terms of Service", href: "#" },
    { name: "Contact", href: "#" },
  ],
};

export const examples = [
  {
    name: "Example #1",
    description: "Describe your example here.",
    imageSrc: kivo,
    href: "#",
  },
  {
    name: "Example #2",
    description: "Describe your example here.",
    imageSrc: messync,
    href: "#",
  },
  {
    name: "Example #3",
    description: "Describe your example here.",
    imageSrc: microinfluencerClub,
    href: "#",
  },
  {
    name: "Example #4",
    description: "Describe your example here.",
    imageSrc: promptpanda,
    href: "#",
  },
  {
    name: "Example #5",
    description: "Describe your example here.",
    imageSrc: reviewradar,
    href: "#",
  },
  {
    name: "Example #6",
    description: "Describe your example here.",
    imageSrc: scribeist,
    href: "#",
  },
  {
    name: "Example #7",
    description: "Describe your example here.",
    imageSrc: searchcraft,
    href: "#",
  },
];
