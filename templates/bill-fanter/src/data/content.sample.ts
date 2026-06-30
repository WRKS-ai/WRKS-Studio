// Default content for the "bill-fanter" template — verbatim copy from
// the original billfanter.com site. Used during template dev so the
// canonical Bill-Fanter site still renders identically post-refactor.
//
// In production, WRKS Studio swaps this import for a per-user file
// generated from their brand_state + brief.

import type { TemplateContent } from './content.schema';

const A = '/assets/664a5b263659c7265be280ad';

// Reused review entries — Bill-Fanter sections cite overlapping students.
const REVIEW_ROB_STALKIE = {
  quote:
    "Bill's Masterclass was incredibly informative and fun. He weaves in and out of topics from trading psychology to charting and makes every lesson accessible to complete beginners. Well worth it!",
  name: 'Rob Stalkie',
  title: 'Account Manager',
  img: `${A}/679c51ea7d9046f26ec04264_rob-stalkie.webp`,
};

export const content: TemplateContent = {
  // ============================================================
  // Hero
  // ============================================================
  hero: {
    headline: "Learn options trading and build income you control",
    subhead:
      "Bill Fanter teaches new and experienced traders how to read the options market, time entries, and place trades with a clear plan.",
    primaryCta: { label: 'Get the masterclass', href: '/masterclass' },
    secondaryCta: { label: 'Join the community', href: '/community' },
    trust: {
      label: 'Recommended by',
      rating: 5,
      count: '1,600+ Students',
    },
    portrait: {
      src: `${A}/68eeba02f9fafe342cd54b44_Gemini_Generated_Image_6ut8i56ut8i56ut8.webp`,
      alt: 'Bill Fanter',
    },
    namecard: {
      name: 'Bill Fanter',
      role: 'Former banker, options mentor',
    },
  },

  // ============================================================
  // AboutBill — "Meet your mentor"
  // ============================================================
  aboutBill: {
    eyebrow: 'Meet your mentor',
    heading: "Hi, I'm Bill Fanter. I'm excited to get to know you.",
    paragraphs: [
      'Over a 35-year career, I became one of the most sought-after executive-level bankers in the industry. I spearheaded the management of some of the largest multi-billion-dollar banks in America, and also taught at the CBA Executive Banking School.',
      "I've spent thousands of hours and thousands of dollars learning the art of trading and testing the best tools for the job. After building my own trading income from scratch, I decided to combine my expertise with my passion and experience in teaching and leadership to help others learn this skill.",
      'I will teach you the exact same strategies that helped me build my wealth from the ground up.',
      'And the best part of all?',
      "I'll make it easy on you. As I like to say&hellip; This ain't rocket science!",
    ],
    cta: { label: 'Book a call', href: '/contact' },
    photo: {
      src: `${A}/664c28db6c354e4acb60d5b7_masterclass%20image-13.webp`,
      alt: 'Bill Fanter',
    },
  },

  // ============================================================
  // Closing — dark footer block with rotating quote + CTA pills
  // ============================================================
  closing: {
    heading: 'Learn to trade options with a proven system.',
    lead:
      'Bill Fanter shows you how to spot setups, size risk, and place trades you understand.',
    trust: {
      label: 'Recommended by',
      rating: 5,
      count: '1,600+ Students',
    },
    reviews: [
      REVIEW_ROB_STALKIE,
      {
        quote:
          'Just wrapped up the masterclass in options trading with Bill Fanter, and I have to say, I absolutely loved it! This old fox (me) picked up some new tricks, proving once again that life always has more to teach you. A big thank you to Bill Fanter for being not just a great teacher, but also a fantastic person and mentor. Now, time to put your lessons into action 🚀',
        name: 'Stijn Ceelen',
        title: 'Seasoned C-level leader in Banking & Wealth(Tech)',
        img: `${A}/678e78e0ad106cbe59c5e816_stijn-ceelen.avif`,
      },
      {
        quote:
          "I just finished taking Bill Fanter's Master Class. It has been an amazing experience. Bill teaches a complex subject and presents it in a way that is easy to process and understand. He has big heart and cares about his students. I would highly recommend this course if you have an interest in trading options.",
        name: 'David Lawson',
        title: 'Founder Icegreen - Beautiful Bags For Brands',
        img: `${A}/678e7a667540897023632d1b_david-lawson.avif`,
      },
      {
        quote:
          "Do not wait to get involved! Bill's master class is highly informative and so well presented. He is an expert with knowledge beyond what most traders have and is incredibly responsive with questions. I cannot say enough about this class nor the incredible trading community Bill has created.",
        name: 'Danielle G',
        title: 'Sr. Epic Application Specialist',
        img: `${A}/679c4ad9a63b20955c05a779_danielle-g.webp`,
      },
    ],
    ctaMore: { label: 'Read all reviews', href: '/student-comments' },
    pills: [
      { label: 'Masterclass', href: '/masterclass' },
      { label: 'Community', href: '/community' },
      { label: 'Free watchlist', href: '/free-watchlist' },
      { label: 'Book a call', href: '/contact' },
      { label: 'Reviews', href: '/student-comments' },
    ],
  },

  // ============================================================
  // Community
  // ============================================================
  community: {
    heading: 'Join my options trading community',
    lead:
      'Trade alongside active options traders who share setups, alerts, and feedback in real time.',
    benefits: [
      { num: '01', title: 'Get instant Discord access', body: 'Join active options traders who share trades, answer questions, and help you start fast.' },
      { num: '02', title: 'See live trade alerts', body: 'Get buy and sell signals from working market analysts as setups form.' },
      { num: '03', title: 'Get daily market analysis', body: 'See Bill break down the market each day so you know what to watch and why.' },
      { num: '04', title: 'Trade in a focused community', body: 'Share setups, wins, and lessons with traders working the same strategies.' },
      { num: '05', title: 'Reach Bill directly', body: 'Ask questions and get answers straight from Bill.' },
    ],
    cta: { label: 'Join the community', href: '/community' },
    screenshot: {
      src: `${A}/68540f8f0903fae1504f6a44_SS.webp`,
      alt: "Bill Fanter's Discord community",
    },
  },

  // ============================================================
  // CommunityPricing
  // ============================================================
  communityPricing: {
    eyebrow: 'Membership',
    heading: 'Join the community',
    lead:
      'Pick a plan and you are in. Download Discord, connect your accounts, and start trading with the community.',
    plans: [
      {
        name: 'Monthly',
        price: '$150',
        period: '/month',
        featured: false,
        badge: null,
        url: 'https://whop.com/checkout/iRQgha92Uek2tWWhX-LAQH-OC2f-p8gz-VdmsucJo7FSM/',
        desc: 'Full community access, billed monthly. Cancel anytime.',
        features: [
          'Real-time trade alerts from Bill and the analyst team',
          "Live buy and sell signals with Bill's notes",
          'Instant Discord access to 1,000+ members',
          'Daily market analysis and watchlist',
          'Risk rules and position sizing guidance',
          'Direct access to Bill in the community',
        ],
      },
      {
        name: 'Yearly',
        price: '$1,500',
        period: '/year',
        featured: true,
        badge: 'Best value',
        url: 'https://whop.com/checkout/Vh9cSagj8l5fRZFgR-eKu5-10rf-wqwM-pT6GfoEaA0Zh/',
        desc:
          'Everything in Monthly, billed yearly, with two months free. Cancel anytime.',
        features: [
          'Everything in the Monthly plan',
          'Two months free vs paying monthly',
          'Members-only sessions and events',
        ],
      },
    ],
  },

  // ============================================================
  // EffortlessStrategy
  // ============================================================
  effortlessStrategy: {
    heading: 'Effortless trading.<br />Real strategy.',
    lead:
      "Bill's unified system transforms scattered market noise into a clear, repeatable strategy. No prior trading experience required.",
    cta: { label: 'Book a call', href: '/contact' },
    review: {
      quote: REVIEW_ROB_STALKIE.quote,
      name: REVIEW_ROB_STALKIE.name,
      title: REVIEW_ROB_STALKIE.title,
      img: REVIEW_ROB_STALKIE.img,
    },
    features: [
      { lead: 'Automate the boring stuff', rest: ' with proven setups and alert systems so you spend less time hunting and more time executing.' },
      { lead: 'Trade with conviction', rest: ' alongside a community of serious traders and real-time signals from 5 professional analysts.' },
      { lead: 'Build long-term wealth', rest: ' with risk-managed strategies designed for sustained results, not lottery-ticket bets.' },
    ],
    image: {
      src: `${A}/664c28d76c354e4acb60d3d4_masterclass%20image.webp`,
      alt: 'Bill Fanter working at his laptop',
    },
  },

  // ============================================================
  // HelpGrid — three-up icon cards
  // ============================================================
  helpGrid: {
    heading: 'Trade options with confidence and grow your income',
    cards: [
      {
        title: 'Earn beyond your paycheck',
        body: 'Take control of your income and lean less on your 9 to 5.',
        iconPaths:
          '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2.4"/><path d="M6 12h.01M18 12h.01"/>',
      },
      {
        title: 'Trade with independence',
        body: 'Learn to read the options market and trade with a plan, not guesses.',
        iconPaths: '<path d="M3 17l6-6 4 4 8-8"/><path d="M14 7h7v7"/>',
      },
      {
        title: 'Build long-term wealth',
        body: 'Use proven options trading strategies to grow and keep wealth over time.',
        iconPaths: '<path d="m3 20 6-11 4 6 2-3 6 8z"/><path d="M3 20h18"/>',
      },
    ],
  },

  // ============================================================
  // HeroSplit — Welcome bento (video reel + quote tile + photo)
  // ============================================================
  heroSplit: {
    eyebrow: 'Welcome to Bill Fanter',
    heading: 'Learn proven options trading strategies that work in any market',
    lead:
      'Go past random tips and learn a repeatable options trading system. Bill shows you how to read setups, manage risk, and trade with a plan you can run on your own.',
    cta: { label: 'Join the masterclass', href: '/masterclass' },
    trust: {
      label: 'Recommended by',
      rating: 5,
      count: '1,600+ Students',
    },
    quote: {
      text:
        "Bill's Masterclass was incredibly informative and fun. He makes every lesson accessible to complete beginners. Well worth it.",
      name: 'Rob Stalkie',
      title: 'Account Manager',
    },
    quoteLink: { label: 'Read more reviews', href: '/student-comments' },
    photo: {
      src: `${A}/664a67e595a23dde11b862af_home%20images-5.webp`,
      alt: 'Bill Fanter at his trading desk',
    },
    videoVimeoId: '1202056894',
  },

  // ============================================================
  // MegaBento — homepage hero grid
  // ============================================================
  megaBento: {
    heading: 'Everything you need to trade options with confidence',
    tiles: [
      {
        kind: 'image',
        featured: true,
        span: 'w4',
        href: '/masterclass',
        title: 'The options masterclass',
        img: `${A}/664a67e526974fa9873cf4b0_home%20images-6.webp`,
        aria:
          'Explore the Masterclass: go from beginner to confident options trader in 6 live sessions',
      },
      {
        kind: 'gradient',
        span: 'w2',
        grad: 'linear-gradient(135deg, #FF8308 0%, #EF4444 52%, #6B3BD5 100%)',
        g1: '#FF8308',
        g2: '#EF4444',
        g3: '#6B3BD5',
        device: `${A}/68554a4edca41e9e9ce967e7_Build-Your-Skill-and-Confidence-(1).webp`,
        href: '/community',
        title: 'The trading community',
        aria:
          'Join the Community: live Discord with real-time trade alerts and 1,000+ traders',
      },
      {
        kind: 'gradient',
        span: 'w2',
        square: true,
        grad: 'linear-gradient(135deg, #1754d8 0%, #3b82f6 55%, #0b1f5c 100%)',
        g1: '#1754d8',
        g2: '#3b82f6',
        g3: '#0b1f5c',
        pick: `${A}/664c28d96e93d6cd1148821f_masterclass%20image-11.webp`,
        href: '/free-watchlist',
        title: 'Free stock watchlist',
        aria:
          "Get the free watchlist: a curated weekly list of stocks Bill is watching, delivered every Sunday",
      },
      {
        kind: 'image',
        span: 'w2',
        href: '/webinar',
        title: 'Free trading webinar',
        img: `${A}/664c28d7ea8baa25095372ee_masterclass%20image-1.webp`,
        aria:
          'Watch the free webinar: a 60-minute training on how Bill finds, manages, and closes trades',
      },
      {
        kind: 'gradient',
        span: 'w2',
        tall: true,
        grad: '#0a0a0a',
        video:
          'https://player.vimeo.com/video/1201304705?background=1&autoplay=1&muted=1&loop=1&controls=0&playsinline=1&dnt=1',
        href: 'https://www.youtube.com/@BillFanter',
        target: '_blank',
        title: 'YouTube',
        icon:
          '<path d="M2 8.5a4 4 0 0 1 4-4h12a4 4 0 0 1 4 4v7a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4z"/><path d="M10.5 9.2l4.5 2.8-4.5 2.8z"/>',
        aria: "Watch trading insights on Bill Fanter's YouTube channel",
      },
      {
        kind: 'reviews',
        span: 'w4',
        href: '/student-comments',
        title: 'Student reviews',
        aria: 'Read student reviews: real results from 500+ students',
        testimonials: [
          {
            quote:
              "Thank you Bill for your mentorship! I'm a huge advocate of your patient & disciplined approach to trading. Learning the correct way to identify & trade liquidity while managing risk is a valuable skill that can be lifechanging when executed properly!",
            name: 'John Gordy',
            title: 'Chief Financial Officer at DroneUp',
            img: `${A}/678e77c8a0abd734e3415731_jogn-gordy.avif`,
          },
          {
            quote:
              "It was an absolute joy learning from Bill. The brightest people can take complex ideas and explain them with simplicity. Bill certainly exemplifies this. I'm very much looking forward to continuing to grow my knowledge alongside the great community Bill has created.",
            name: 'Riley H',
            title: 'Sales Specialist at AB Laboratories Inc.',
            img: `${A}/678e7871274732ce809d928f_riley-h.avif`,
          },
          {
            quote:
              "I just completed Bill Fanter's Options Masterclass; it was a great introduction to trading options and an overall enjoyable experience. If you want to learn about the options market from someone who is a successful trader and passionate to share his skills, I highly recommend Bill's Masterclass.",
            name: 'Alex Pitcaithly',
            title: 'Dynamic People Leader',
            img: `${A}/679c4c1c4e9c2e629f9dabd4_alex-pitcaithly.webp`,
          },
          {
            quote:
              "I can't say enough about Bill Fanter! This masterclass was a true eye-opener. As a former financial advisor in a previous life, I learned things in Bill's class that I never had before. And the education doesn't stop with the class; there is a community of like-minded traders, all ready and willing to help.",
            name: 'Dan Funderburk',
            title: 'Executive Recruiting at H-E-B',
            img: `${A}/679c4f04407a54b6277c94f3_dan-funderburk.webp`,
          },
        ],
      },
    ],
  },

  // ============================================================
  // Reviews — written carousel + screenshot wall
  // ============================================================
  reviews: {
    eyebrow: 'Student reviews',
    heading: 'Hear success stories from real options traders learning with Bill',
    videoVimeoIds: ['1173480173', '1173480185', '1173480159'],
    screenshots: [
      '68762145f84c52b1d73b6639_Screenshot%202025-07-11%20at%204.35.49%E2%80%AFPM.webp',
      '687621ada403613c0a3bf9af_Screenshot%202025-07-11%20at%204.36.25%E2%80%AFPM.webp',
      '687621cda307f7320689063b_Screenshot%202025-07-11%20at%204.36.38%E2%80%AFPM.webp',
      '687621e6a05e43a792e67ecb_Screenshot%202025-07-11%20at%204.36.52%E2%80%AFPM.webp',
      '6876224cb841f03797602362_Screenshot%202025-07-11%20at%204.37.58%E2%80%AFPM.webp',
      '687622afa403613c0a3d2313_Screenshot%202025-07-11%20at%204.38.40%E2%80%AFPM.webp',
      '687622c7b4b62d3a9e0a9cbb_Screenshot%202025-07-11%20at%204.38.54%E2%80%AFPM.webp',
      '687622e9b4b62d3a9e0ac571_Screenshot%202025-07-11%20at%204.39.05%E2%80%AFPM.webp',
      '68762304b841f0379760ecc0_Screenshot%202025-07-11%20at%204.39.24%E2%80%AFPM.webp',
      '68762321751e88dc018a9bbb_Screenshot%202025-07-11%20at%204.39.37%E2%80%AFPM.webp',
      '6876233d508506c496696b2d_Screenshot%202025-07-11%20at%204.39.51%E2%80%AFPM.webp',
      '68e5a295a9096b6352947f15_Screenshot%202025-10-05%20at%204.00.09%E2%80%AFPM.webp',
      '68e5a295e9af62f951313a30_Screenshot%202025-10-05%20at%203.51.50%E2%80%AFPM.webp',
      '68e5a2958f2a94f22caf2a25_Screenshot%202025-10-05%20at%203.53.45%E2%80%AFPM.webp',
      '68e5a29546cc9711d4029259_Screenshot%202025-10-05%20at%203.54.11%E2%80%AFPM.webp',
      '68e5a295601e158164a7660d_Screenshot%202025-10-05%20at%203.56.04%E2%80%AFPM.webp',
      '68e5a295afd89572b1cacf71_Screenshot%202025-10-05%20at%203.57.40%E2%80%AFPM.webp',
      '68e5a29501f9e5dd806d9ddc_Screenshot%202025-10-05%20at%203.58.23%E2%80%AFPM.webp',
      '68e5a29543247efa5797c82c_Screenshot%202025-10-05%20at%203.58.48%E2%80%AFPM.webp',
      '68e5a295820df7997ccaedb4_Screenshot%202025-10-05%20at%203.59.48%E2%80%AFPM.webp',
    ],
    cta: { label: 'See all reviews', href: '/student-comments' },
  },

  // ============================================================
  // Spotlight — full-bleed CTA card with GridDistortion bg
  // ============================================================
  spotlight: {
    heading: 'Learn options trading in my free demo webinar',
    lead:
      'Whether you are new to options or sharpening your skills, this free webinar shows how the options market works and how to place your first trade with a plan.',
    cta: { label: 'Watch webinar', href: '/webinar' },
    ctaIcon: true,
    distortionImage: '/assets/sandbox/webinar-distortion.webp?v=2',
  },

  // ============================================================
  // VideoTestimonials
  // ============================================================
  videoTestimonials: {
    heading: 'Hear it straight from students',
    lead:
      'Real students on what the masterclass and community changed for their trading.',
    videoVimeoIds: [
      '1173480173',
      '1173480185',
      '1173480159',
      '1173480212',
      '1173480196',
    ],
  },

  // ============================================================
  // Watchlist — subscribe form
  // ============================================================
  watchlist: {
    eyebrow: 'Free weekly watchlist',
    heading: 'Get a curated weekly stock options watchlist',
    lead:
      'Each week, get a short list of stocks set up for potential moves. It lands straight in your inbox. Use it to spot setups early and plan your options trades before the market opens.',
    submitLabel: 'Subscribe',
    namePlaceholder: 'Name',
    emailPlaceholder: 'Email',
    lockedPreview: {
      src: `${A}/bf-watchlist-locked.webp`,
      alt:
        'Preview of the weekly stock options watchlist, with the full list locked',
    },
    tickerA: [
      ['AAPL', '+1.2%', 'up'],
      ['NVDA', '+2.4%', 'up'],
      ['SPY', '+0.4%', 'up'],
      ['TSLA', '-0.8%', 'down'],
      ['QQQ', '+0.6%', 'up'],
      ['AMD', '+1.9%', 'up'],
      ['MSFT', '+0.3%', 'up'],
      ['META', '-0.5%', 'down'],
    ],
    tickerB: [
      ['AMZN', '+0.9%', 'up'],
      ['GOOGL', '+0.7%', 'up'],
      ['NFLX', '-1.1%', 'down'],
      ['AVGO', '+1.4%', 'up'],
      ['COIN', '+3.2%', 'up'],
      ['PLTR', '+2.1%', 'up'],
      ['SMCI', '-2.3%', 'down'],
      ['ARM', '+1.6%', 'up'],
    ],
  },

  // ============================================================
  // YoutubeCta — black card with channel preview
  // ============================================================
  youtubeCta: {
    heading: 'Get options trading insights on my YouTube channel',
    lead:
      'Watch free breakdowns of real trades, market setups, and options trading strategies. Subscribe to learn something new each week.',
    cta: {
      label: 'Watch on YouTube',
      href: 'https://www.youtube.com/@BillFanter',
      target: '_blank',
    },
    channelImage: {
      src: `${A}/bf-youtube-channel.webp`,
      alt: "Bill Fanter's YouTube channel",
    },
  },
};
