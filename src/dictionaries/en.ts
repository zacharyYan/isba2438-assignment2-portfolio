import type { Dictionary } from "./zh";

const en: Dictionary = {
  siteTitle: "Portfolio",
  siteDescription:
    "Zhike Yan's portfolio: business analytics, data science and machine learning projects, plus front-end development work.",
  nav: {
    home: "Home",
    projects: "Projects",
    blog: "Blog",
    about: "About Me",
    contact: "Contact",
  },
  home: {
    viewProjects: "View Projects",
    aboutMe: "About Me",
    featured: "Featured Projects",
    allProjects: "All projects →",
  },
  projects: {
    title: "Projects",
    count: "{n} projects in total",
    featuredBadge: "Featured",
    backToList: "← Back to projects",
    linkSource: "View source on GitHub",
    linkDemo: "Live Demo",
    linkTbd: "Project link (to be added)",
    notFoundTitle: "404 · Project not found",
    notFoundMessage:
      "This project does not exist or has been removed. Please pick one from the project list.",
    backToProjects: "Back to projects",
  },
  about: {
    title: "About Me",
    education: "Education",
    experience: "Experience",
    skills: "Skills",
    misc: "More",
    languages: "Languages",
    interests: "Interests",
  },
  contact: {
    title: "Contact Me",
    intro:
      "Submissions are validated and saved on the server. You can also reach me through:",
    email: "Email",
    phone: "Phone",
    formName: "Name",
    formEmail: "Email",
    formMessage: "Message",
    submit: "Submit",
    submitting: "Submitting…",
    success: "Submitted successfully. Your message has been saved.",
    validationError:
      "Server-side validation failed. Please fix the errors below and try again.",
    saveError:
      "Saving failed. Your submission was not written. Please try again later.",
    networkError:
      "Network error. Make sure the local server is running and try again.",
    invalidRequest:
      "The request format is invalid. Refresh the page and try again.",
    serverFormLink:
      "You can also use the original Server Action form to submit →",
  },
  blog: {
    title: "Blog",
    empty: "No posts yet.",
    loading: "Loading…",
    listError: "Loading the posts failed. Check the local server and retry.",
    retry: "Retry",
    readMore: "Read more →",
    backToList: "← Back to the blog",
    notFoundTitle: "404 · Post not found",
    notFoundMessage: "This post does not exist or has been removed.",
    backToBlogs: "Back to the blog",
    storageError: "Loading this post failed. Please try again later.",
    adminLink: "Manage posts →",
    adminTitle: "Create a post",
    adminIntro:
      "Creates a post via POST /api/blogs (local demo, no authentication).",
    formTitle: "Title",
    formSlug: "Slug (lowercase letters, digits, hyphens)",
    formSummary: "Summary (optional)",
    formBody: "Body",
    submit: "Publish",
    submitting: "Publishing…",
    success: "Published successfully.",
    viewPost: "View the new post →",
    validationError:
      "Server-side validation failed. Please fix the errors below and try again.",
    invalidRequest:
      "The request format is invalid. Refresh the page and try again.",
    saveError:
      "Saving failed. Your post was not written. Please try again later.",
    duplicateSlug: "This slug is already taken. Please choose another one.",
    networkError:
      "Network error. Make sure the local server is running and try again.",
    createdAt: "Published",
  },
  errors: {
    nameEmpty: "Name cannot be empty (after trimming whitespace)",
    messageEmpty: "Message cannot be empty (after trimming whitespace)",
    emailWhitespace: "Email must not contain whitespace",
    emailSingleAt: "Email must contain exactly one @",
    emailLocalEmpty: "Email must have something before the @",
    emailDomainDot: "Email domain must contain a dot",
    emailDomainSegment: "Each dot-separated part of the email domain must be non-empty",
    titleEmpty: "Title cannot be empty (after trimming whitespace)",
    slugEmpty: "Slug cannot be empty",
    slugFormat:
      "Slug may only contain lowercase letters, digits and hyphens, and must not start or end with a hyphen",
    bodyEmpty: "Body cannot be empty (after trimming whitespace)",
  },
  notFound: {
    title: "404 · Page not found",
    message: "The requested page does not exist.",
    backHome: "Back to home",
  },
  footer: {
    contactMe: "Contact me",
  },
};

export default en;
