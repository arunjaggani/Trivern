# TRIVERN WEBSITE - IMPLEMENTATION GUIDE

## Quick Start Template

### 1. Button Component (React/Next.js)

```jsx
// components/Button.tsx
import React from 'react';
import { ChevronRight } from 'lucide-react';

interface ButtonProps {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  showArrow?: boolean;
  disabled?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  children,
  href,
  onClick,
  showArrow = true,
  disabled = false,
}) => {
  const baseStyles = 'font-semibold rounded-lg transition-all duration-300 flex items-center justify-center gap-2 cursor-pointer';
  
  const variantStyles = {
    primary: 'bg-[#00D4FF] text-[#0F1419] hover:bg-[#00A8CC] active:scale-95',
    secondary: 'border-2 border-[#00D4FF] text-[#F5F5F5] hover:bg-cyan-500/10 hover:border-[#00A8CC] active:bg-cyan-500/20',
  };

  const sizeStyles = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  const buttonClasses = `${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`;

  const ButtonContent = () => (
    <>
      {children}
      {showArrow && <ChevronRight size={16} />}
    </>
  );

  if (href) {
    return (
      <a href={href} className={buttonClasses}>
        <ButtonContent />
      </a>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={buttonClasses}>
      <ButtonContent />
    </button>
  );
};
```

### 2. Card Component

```jsx
// components/Card.tsx
import React from 'react';

interface CardProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  children?: React.ReactNode;
  hoverable?: boolean;
  index?: number;
}

export const Card: React.FC<CardProps> = ({
  icon,
  title,
  description,
  children,
  hoverable = true,
  index,
}) => {
  return (
    <div
      className={`
        p-6 rounded-lg border transition-all duration-300
        ${hoverable 
          ? 'bg-white/5 border-cyan-500/30 hover:bg-cyan-500/10 hover:border-cyan-500/50 hover:shadow-lg hover:scale-102' 
          : 'bg-white/5 border-cyan-500/30'
        }
        ${index ? 'animate-fadeInUp' : ''}
      `}
      style={{ animationDelay: index ? `${index * 100}ms` : '0ms' }}
    >
      {icon && <div className="mb-4 text-cyan-500">{icon}</div>}
      <h4 className="text-xl font-semibold text-white mb-3">{title}</h4>
      <p className="text-gray-300 text-sm leading-relaxed mb-4">{description}</p>
      {children}
    </div>
  );
};
```

### 3. Contact Form Component

```jsx
// components/ContactForm.tsx
import React, { useState } from 'react';
import { Button } from './Button';

export const ContactForm: React.FC = () => {
  const [formData, setFormData] = useState({
    requestType: '',
    name: '',
    company: '',
    email: '',
    phone: '',
    website: '',
    context: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.requestType) {
      newErrors.requestType = 'Please select a request type';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (!formData.email && !formData.phone) {
      newErrors.contact = 'Please provide either email or phone';
    }

    if (formData.context && formData.context.length < 10) {
      newErrors.context = 'Please provide at least 10 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    try {
      // Send to your backend/API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        setFormData({
          requestType: '',
          name: '',
          company: '',
          email: '',
          phone: '',
          website: '',
          context: '',
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
    }
  };

  const requestTypes = [
    'Install a new website system',
    'Increase conversions (less friction)',
    'Automation + follow-up + routing',
    'Audit our current setup',
  ];

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl mx-auto">
      {/* Request Type */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-white mb-4">
          What are you looking for? *
        </label>
        <div className="space-y-3">
          {requestTypes.map((type) => (
            <label key={type} className="flex items-center gap-3 cursor-pointer">
              <input
                type="radio"
                name="requestType"
                value={type}
                checked={formData.requestType === type}
                onChange={(e) =>
                  setFormData({ ...formData, requestType: e.target.value })
                }
                className="w-4 h-4 accent-cyan-500"
              />
              <span className="text-gray-300">{type}</span>
            </label>
          ))}
        </div>
        {errors.requestType && (
          <p className="text-red-500 text-sm mt-2">{errors.requestType}</p>
        )}
      </div>

      {/* Name and Company */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Name (optional)
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-cyan-500/30 text-white placeholder-gray-600 focus:border-cyan-500 focus:bg-cyan-500/10 outline-none transition"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Company (optional)
          </label>
          <input
            type="text"
            value={formData.company}
            onChange={(e) =>
              setFormData({ ...formData, company: e.target.value })
            }
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-cyan-500/30 text-white placeholder-gray-600 focus:border-cyan-500 focus:bg-cyan-500/10 outline-none transition"
            placeholder="Your company"
          />
        </div>
      </div>

      {/* Email and Phone */}
      <div className="grid grid-cols-2 gap-6 mb-6">
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Email *
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className={`w-full px-4 py-3 rounded-lg bg-white/5 border text-white placeholder-gray-600 focus:bg-cyan-500/10 outline-none transition ${
              errors.email ? 'border-red-500' : 'border-cyan-500/30 focus:border-cyan-500'
            }`}
            placeholder="your@email.com"
          />
          {errors.email && (
            <p className="text-red-500 text-sm mt-1">{errors.email}</p>
          )}
        </div>
        <div>
          <label className="block text-sm font-semibold text-white mb-2">
            Phone *
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="w-full px-4 py-3 rounded-lg bg-white/5 border border-cyan-500/30 text-white placeholder-gray-600 focus:border-cyan-500 focus:bg-cyan-500/10 outline-none transition"
            placeholder="+1 (555) 000-0000"
          />
        </div>
      </div>

      {/* Website */}
      <div className="mb-6">
        <label className="block text-sm font-semibold text-white mb-2">
          Website (optional, include https://)
        </label>
        <input
          type="url"
          value={formData.website}
          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
          className="w-full px-4 py-3 rounded-lg bg-white/5 border border-cyan-500/30 text-white placeholder-gray-600 focus:border-cyan-500 focus:bg-cyan-500/10 outline-none transition"
          placeholder="https://yoursite.com"
        />
      </div>

      {/* Context */}
      <div className="mb-8">
        <label className="block text-sm font-semibold text-white mb-2">
          Context (10+ chars) *
        </label>
        <textarea
          value={formData.context}
          onChange={(e) => setFormData({ ...formData, context: e.target.value })}
          placeholder="What do you sell? Who is it for? What's the current bottleneck?"
          className={`w-full px-4 py-3 rounded-lg bg-white/5 border text-white placeholder-gray-600 focus:bg-cyan-500/10 outline-none transition resize-none ${
            errors.context ? 'border-red-500' : 'border-cyan-500/30 focus:border-cyan-500'
          }`}
          rows={5}
        />
        {errors.context && (
          <p className="text-red-500 text-sm mt-1">{errors.context}</p>
        )}
        <p className="text-gray-500 text-sm mt-2">
          We use this to route you correctly and avoid unnecessary calls.
        </p>
      </div>

      {/* Submit */}
      <Button variant="primary" size="lg">
        Send request
      </Button>

      {submitted && (
        <div className="mt-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400">
          Thank you! We'll get back to you soon.
        </div>
      )}
    </form>
  );
};
```

### 4. Navigation Component

```jsx
// components/Navigation.tsx
import React from 'react';
import Link from 'next/link';
import { Button } from './Button';

export const Navigation: React.FC = () => {
  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/services', label: 'Services' },
    { href: '/how-it-works', label: 'How it works' },
    { href: '/about', label: 'About' },
    { href: '/contact', label: 'Contact' },
  ];

  return (
    <nav className="fixed top-0 w-full z-50 bg-gradient-to-br from-slate-900/95 to-slate-950/95 backdrop-blur-md border-b border-cyan-500/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 font-bold text-white text-xl">
            <div className="w-8 h-8 bg-cyan-500 rounded-lg flex items-center justify-center text-slate-900 font-bold">
              T
            </div>
            <span>Trivern</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-cyan-500 transition text-sm font-medium"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* CTA Button */}
          <Button href="/contact" variant="primary" size="sm">
            Get an install plan
          </Button>
        </div>
      </div>
    </nav>
  );
};
```

### 5. Hero Section Component

```jsx
// components/Hero.tsx
import React from 'react';
import { Button } from './Button';

interface HeroProps {
  title: string;
  subtitle: string;
  cta?: {
    text: string;
    href: string;
  };
  children?: React.ReactNode;
  gradient?: boolean;
}

export const Hero: React.FC<HeroProps> = ({
  title,
  subtitle,
  cta,
  children,
  gradient = true,
}) => {
  return (
    <section
      className={`
        mt-16 pt-20 pb-20 relative overflow-hidden
        ${gradient ? 'bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900' : ''}
      `}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="white" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        <div className="max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 leading-tight">
            {title}
          </h1>
          <p className="text-lg md:text-xl text-gray-300 mb-12 leading-relaxed max-w-3xl">
            {subtitle}
          </p>

          {cta && (
            <Button href={cta.href} variant="primary" size="lg">
              {cta.text}
            </Button>
          )}
        </div>

        {children}
      </div>
    </section>
  );
};
```

### 6. Process Step Component

```jsx
// components/ProcessStep.tsx
import React from 'react';

interface ProcessStepProps {
  step: number;
  title: string;
  description: string;
  icon?: React.ReactNode;
}

export const ProcessStep: React.FC<ProcessStepProps> = ({
  step,
  title,
  description,
  icon,
}) => {
  return (
    <div className="relative">
      {/* Step Number */}
      <div className="text-7xl font-bold text-cyan-500/20 mb-4">{step.toString().padStart(2, '0')}</div>

      {/* Card */}
      <div className="p-6 rounded-lg bg-white/5 border border-cyan-500/30 hover:bg-cyan-500/10 transition">
        {icon && <div className="mb-4 text-cyan-500 w-10 h-10">{icon}</div>}
        <h3 className="text-2xl font-bold text-white mb-3">{title}</h3>
        <p className="text-gray-300 leading-relaxed">{description}</p>
      </div>
    </div>
  );
};
```

## CSS Animations (Tailwind + Framer Motion)

### Add to `globals.css`

```css
@layer utilities {
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-fadeInUp {
    animation: fadeInUp 0.6s ease-out forwards;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .animate-slideDown {
    animation: slideDown 0.3s ease-out;
  }

  @keyframes scaleIn {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }

  .animate-scaleIn {
    animation: scaleIn 0.3s ease-out;
  }
}
```

## Next.js Page Structure Example

```jsx
// pages/index.tsx
import React from 'react';
import { Navigation } from '@/components/Navigation';
import { Hero } from '@/components/Hero';
import { Card } from '@/components/Card';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/Button';

export default function Home() {
  return (
    <>
      <Navigation />
      
      <Hero
        title="We install growth-ready websites with built-in AI & automation."
        subtitle="Capture intent, qualify, and follow up automatically — without adding noise to your brand."
        cta={{ text: 'Get an install plan', href: '/contact' }}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
          <Card
            title="Conversion Instrumentation"
            description="Track every step of your funnel"
            icon={<BarChart3 size={24} />}
          />
          <Card
            title="High-intent Results"
            description="Qualify leads before contact"
            icon={<Target size={24} />}
          />
          <Card
            title="Follow-up Automation"
            description="Never miss a lead"
            icon={<Zap size={24} />}
          />
        </div>
      </Hero>

      {/* More sections... */}

      <Footer />
    </>
  );
}
```

## Environment Setup (package.json)

```json
{
  "dependencies": {
    "react": "^18.0.0",
    "react-dom": "^18.0.0",
    "next": "^13.0.0",
    "tailwindcss": "^3.3.0",
    "framer-motion": "^10.0.0",
    "lucide-react": "^0.263.0",
    "react-hook-form": "^7.45.0"
  },
  "devDependencies": {
    "typescript": "^5.0.0",
    "@types/react": "^18.0.0",
    "@types/node": "^20.0.0",
    "autoprefixer": "^10.4.0",
    "postcss": "^8.4.0"
  }
}
```

## Form Validation Helper

```jsx
// utils/validation.ts
export const validateEmail = (email: string): boolean => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

export const validatePhone = (phone: string): boolean => {
  return /^[\d\s\-\+\(\)]+$/.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

export const validateUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const validateContext = (context: string): boolean => {
  return context.trim().length >= 10;
};
```

## SEO Meta Tags Template

```jsx
// utils/seo.ts
export const siteMeta = {
  title: 'Trivern - Growth-Ready Systems',
  description: 'We install growth-ready websites with built-in AI & automation.',
  url: 'https://trivern.com',
  image: 'https://trivern.com/og-image.png',
  twitter: '@trivern',
};

export const getPageMeta = (page: string) => {
  const pageMeta: Record<string, any> = {
    home: {
      title: 'Trivern - Growth-Ready Systems',
      description: 'We install growth-ready websites with built-in AI & automation.',
    },
    services: {
      title: 'Services - Trivern',
      description: 'Web development, marketing, branding, and automation services.',
    },
    'how-it-works': {
      title: 'How It Works - Trivern',
      description: 'A predictable install process for your growth-ready system.',
    },
    about: {
      title: 'About - Trivern',
      description: 'We build systems that your team can run.',
    },
    contact: {
      title: 'Contact - Trivern',
      description: 'Get an install plan for your growth system.',
    },
  };

  return pageMeta[page] || pageMeta.home;
};
```

## Testing Checklist

- [ ] All pages load without errors
- [ ] Navigation links work correctly
- [ ] Forms validate properly
- [ ] Buttons are clickable and functional
- [ ] Responsive design works on mobile, tablet, desktop
- [ ] All images load and display correctly
- [ ] Contact form submission works
- [ ] Animations are smooth (60fps)
- [ ] Lighthouse score 90+
- [ ] Accessibility score 95+
- [ ] All links are active and functional
- [ ] Form error messages display clearly
