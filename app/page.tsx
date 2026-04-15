import connectDB from '@/lib/mongodb';
import ProfileModel from '@/models/Profile';
import SiteSettingsModel from '@/models/SiteSettings';
import ProjectModel from '@/models/Project';
import ExperienceModel from '@/models/Experience';
import SkillModel from '@/models/Skill';
import CertificationModel from '@/models/Certification';
import EducationModel from '@/models/Education';

import Navbar from '@/components/Navbar';
import Hero from '@/components/sections/Hero';
import About from '@/components/sections/About';
import Skills from '@/components/sections/Skills';
import Experience from '@/components/sections/Experience';
import Projects from '@/components/sections/Projects';
import Certifications from '@/components/sections/Certifications';
import EducationSection from '@/components/sections/EducationSection';
import Contact from '@/components/sections/Contact';
import Footer from '@/components/Footer';
import ScrollToTop from '@/components/ScrollToTop';

export const revalidate = 3600;

type SectionConfig = {
  key: string;
  labelEn: string;
  labelAr: string;
  visible: boolean;
  order: number;
};

async function getData() {
  try {
    await connectDB();
    const [profile, settings, projects, experience, skills, certifications, education] = await Promise.all([
      ProfileModel.findOne().lean(),
      SiteSettingsModel.findOne().lean(),
      ProjectModel.find({ visible: true }).sort({ displayOrder: 1, createdAt: -1 }).lean(),
      ExperienceModel.find({ visible: true }).sort({ order: 1 }).lean(),
      SkillModel.find({ visible: true }).sort({ category: 1, order: 1 }).lean(),
      CertificationModel.find({ visible: true }).sort({ order: 1 }).lean(),
      EducationModel.find({ visible: true }).sort({ order: 1 }).lean(),
    ]);

    return {
      profile: JSON.parse(JSON.stringify(profile)),
      settings: JSON.parse(JSON.stringify(settings)),
      projects: JSON.parse(JSON.stringify(projects)),
      experience: JSON.parse(JSON.stringify(experience)),
      skills: JSON.parse(JSON.stringify(skills)),
      certifications: JSON.parse(JSON.stringify(certifications)),
      education: JSON.parse(JSON.stringify(education)),
    };
  } catch {
    return {
      profile: null, settings: null, projects: [], experience: [],
      skills: [], certifications: [], education: [],
    };
  }
}

function isSectionVisible(settings: Record<string, unknown> | null, key: string): boolean {
  if (!settings) return true;
  const sections = settings.sections as Array<{ key: string; visible: boolean }> | undefined;
  if (!sections || sections.length === 0) return true;
  const section = sections.find((s) => s.key === key);
  return section ? section.visible : true;
}

const DEFAULT_SECTIONS: SectionConfig[] = [
  { key: 'hero', labelEn: 'Hero', labelAr: 'الرئيسية', visible: true, order: 1 },
  { key: 'about', labelEn: 'About', labelAr: 'عن', visible: true, order: 2 },
  { key: 'skills', labelEn: 'Skills', labelAr: 'المهارات', visible: true, order: 3 },
  { key: 'experience', labelEn: 'Experience', labelAr: 'الخبرة', visible: true, order: 4 },
  { key: 'education', labelEn: 'Education', labelAr: 'التعليم', visible: true, order: 5 },
  { key: 'projects', labelEn: 'Projects', labelAr: 'المشاريع', visible: true, order: 6 },
  { key: 'certifications', labelEn: 'Certifications', labelAr: 'الشهادات', visible: true, order: 7 },
  { key: 'contact', labelEn: 'Contact', labelAr: 'التواصل', visible: true, order: 8 },
];

export default async function Home() {
  const { profile, settings, projects, experience, skills, certifications, education } = await getData();

  if (settings?.maintenanceMode) {
    return (
      <>
        <Navbar sections={[]} />
        <main className="min-h-screen bg-background pt-24">
          <section className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-3xl items-center justify-center px-4 sm:px-6 lg:px-8">
            <div className="glass w-full rounded-3xl p-8 text-center sm:p-10">
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-primary">
                Maintenance
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
                We&rsquo;ll be back shortly.
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-muted-foreground sm:text-base">
                The portfolio is temporarily unavailable while updates are being applied. Please
                check back soon.
              </p>
            </div>
          </section>
        </main>
      </>
    );
  }

  const configuredSections =
    (settings?.sections as SectionConfig[] | undefined)?.length
      ? (settings.sections as SectionConfig[])
      : DEFAULT_SECTIONS;

  const orderedSections = [...configuredSections]
    .filter((section) => isSectionVisible(settings, section.key))
    .sort((a, b) => a.order - b.order);

  const sectionMap: Record<string, React.ReactNode> = {
    hero: <Hero profile={profile} />,
    about: <About profile={profile} />,
    skills: <Skills skills={skills} />,
    experience: <Experience experiences={experience} />,
    education: <EducationSection education={education} />,
    projects: <Projects projects={projects} />,
    certifications: <Certifications certifications={certifications} />,
    contact: <Contact profile={profile} />,
  };

  const navSections = orderedSections.filter((section) => section.key !== 'hero');

  return (
    <>
      <Navbar sections={navSections} />
      <main>
        {orderedSections.map((section) => (
          <div key={section.key}>{sectionMap[section.key]}</div>
        ))}
      </main>
      <Footer
        profile={profile}
        footerTextEn={settings?.footerTextEn}
        footerTextAr={settings?.footerTextAr}
      />
      <ScrollToTop />
    </>
  );
}
