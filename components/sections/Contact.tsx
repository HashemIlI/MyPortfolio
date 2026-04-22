'use client';

import type { ReactNode } from 'react';
import { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send, MessageCircle, Github, Linkedin } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import SectionWrapper from '@/components/SectionWrapper';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from '@/hooks/use-toast';
import type { ProfileData } from '@/types/content';

interface ContactProps {
  profile: ProfileData | null;
}

export default function Contact({ profile }: ContactProps) {
  const { language, t, isRTL } = useLanguage();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        toast({
          title: t('Message sent!', 'تم الإرسال!'),
          description: t("I'll get back to you soon.", 'سأتواصل معك قريباً.'),
          variant: 'success',
        });
        setForm({ name: '', email: '', subject: '', message: '' });
      } else {
        throw new Error('Failed');
      }
    } catch {
      toast({
        title: t('Error', 'خطأ'),
        description: t('Failed to send message. Please try again.', 'فشل الإرسال. حاول مرة أخرى.'),
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SectionWrapper id="contact" className="bg-muted/10 py-14 lg:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-2 text-sm font-medium uppercase tracking-[0.22em] text-primary">
            {t("Let's connect", 'لنتواصل')}
          </p>
          <h2 className="text-3xl font-bold sm:text-4xl">
            {t('Get In Touch', 'تواصل معي')}
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            {t(
              "Have a project in mind or want to discuss data & AI opportunities? I'd love to hear from you.",
              'هل لديك مشروع في الاعتبار أو تريد مناقشة فرص البيانات والذكاء الاصطناعي؟ يسعدني التواصل معك.'
            )}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
          <div className="space-y-5">
            <div className="glass rounded-2xl p-5 sm:p-6">
              <h3 className="text-lg font-semibold">
                {t('Contact Information', 'معلومات التواصل')}
              </h3>

              <div className="mt-5 grid gap-3">
                {profile?.email && (
                  <ContactItem
                    icon={<Mail className="h-5 w-5" />}
                    label={t('Email', 'البريد الإلكتروني')}
                    value={profile.email}
                    href={`mailto:${profile.email}`}
                  />
                )}
                {profile?.phone && (
                  <ContactItem
                    icon={<Phone className="h-5 w-5" />}
                    label={t('Phone', 'الهاتف')}
                    value={profile.phone}
                    href={`tel:${profile.phone}`}
                  />
                )}
                {profile?.locationEn && (
                  <ContactItem
                    icon={<MapPin className="h-5 w-5" />}
                    label={t('Location', 'الموقع')}
                    value={language === 'ar' ? profile.locationAr || profile.locationEn : profile.locationEn}
                  />
                )}
              </div>
            </div>

            <div className="glass rounded-2xl p-5 sm:p-6">
              <h3 className="text-sm font-semibold text-foreground">
                {t('Social Links', 'روابط التواصل')}
              </h3>
              <div className="mt-4 flex flex-wrap gap-3">
                {profile?.whatsapp && (
                  <Button variant="outline" className="gap-2" asChild>
                    <a href={profile.whatsapp} target="_blank" rel="noopener noreferrer">
                      <MessageCircle className="h-4 w-4 text-primary" />
                      WhatsApp
                    </a>
                  </Button>
                )}
                {profile?.linkedin && (
                  <Button variant="outline" className="gap-2" asChild>
                    <a href={profile.linkedin} target="_blank" rel="noopener noreferrer">
                      <Linkedin className="h-4 w-4 text-primary" />
                      LinkedIn
                    </a>
                  </Button>
                )}
                {profile?.github && (
                  <Button variant="outline" className="gap-2" asChild>
                    <a href={profile.github} target="_blank" rel="noopener noreferrer">
                      <Github className="h-4 w-4" />
                      GitHub
                    </a>
                  </Button>
                )}
                {profile?.kaggle && (
                  <Button variant="outline" className="gap-2" asChild>
                    <a href={profile.kaggle} target="_blank" rel="noopener noreferrer">
                      <svg className="h-4 w-4 text-primary" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.825 23.859c-.022.092-.117.141-.281.141h-3.139c-.187 0-.351-.082-.492-.248l-5.178-6.589-1.448 1.374v5.111c0 .235-.117.352-.351.352H5.505c-.236 0-.354-.117-.354-.352V.353c0-.233.118-.353.354-.353h2.431c.234 0 .351.12.351.353v14.343l6.203-6.272c.165-.165.33-.246.495-.246h3.239c.144 0 .236.06.285.18.046.149.034.27-.036.352l-6.555 6.29 6.876 8.629c.08.107.095.234.031.38z" />
                      </svg>
                      Kaggle
                    </a>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="glass rounded-2xl p-4 space-y-4 sm:p-6"
          >
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="name">{t('Name', 'الاسم')}</Label>
                <Input
                  id="name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder={t('Your name', 'اسمك')}
                  required
                  dir={isRTL ? 'rtl' : 'ltr'}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">{t('Email', 'البريد')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder={t('your@email.com', 'بريدك@example.com')}
                  required
                  dir="ltr"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="subject">{t('Subject', 'الموضوع')}</Label>
              <Input
                id="subject"
                value={form.subject}
                onChange={(e) => setForm({ ...form, subject: e.target.value })}
                placeholder={t('How can I help?', 'كيف يمكنني المساعدة؟')}
                required
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="message">{t('Message', 'الرسالة')}</Label>
              <Textarea
                id="message"
                rows={5}
                value={form.message}
                onChange={(e) => setForm({ ...form, message: e.target.value })}
                placeholder={t("Tell me about your project...", 'أخبرني عن مشروعك...')}
                required
                dir={isRTL ? 'rtl' : 'ltr'}
              />
            </div>
            <Button type="submit" variant="gradient" className="w-full gap-2" disabled={loading}>
              <Send className="h-4 w-4" />
              {loading ? t('Sending...', 'جار الإرسال...') : t('Send Message', 'إرسال')}
            </Button>
          </motion.form>
        </div>
      </div>
    </SectionWrapper>
  );
}

function ContactItem({
  icon,
  label,
  value,
  href,
}: {
  icon: ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const content = (
    <div className="flex items-center gap-3 rounded-2xl border border-border/70 bg-background/30 px-4 py-3 transition-colors hover:border-primary/30 hover:bg-background/50">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );

  if (href) {
    return (
      <a href={href} className="block transition-opacity hover:opacity-90">
        {content}
      </a>
    );
  }
  return content;
}
