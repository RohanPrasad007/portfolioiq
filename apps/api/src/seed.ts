import mongoose from 'mongoose';
import { connectDB } from './config/db';
import { User } from './models/User.model';
import { Resume } from './models/Resume.model';
import { Insight } from './models/Insight.model';

const runSeed = async () => {
  try {
    await connectDB();
    console.log('Clearing database for demo user...');
    
    // Find or create demo user
    let user = await User.findOne({ githubId: 'demo-user' });
    if (!user) {
      user = await User.create({
        githubId: 'demo-user',
        username: 'demo-user',
        email: 'recruiter-demo@portfolioiq.com',
        avatarUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDUck5mQyC92oMTZRFMu4g179A-V89wUL1Vo28Om02gOnOqOAiP6Gl4UoRF4c_wjLxZO-MceUcf-sz6rmSaA9Ys48e3kGVRKdeNFW4YTg8jKU2mjenCZuKMSapSVaY-9o6FvQD4FQkMAnyoyNMUr-MrtGxRUZSwo8TkSPgzgZDT52VOGwiLLcBkRJn0BH7T2TUlxMgnIX54Y-StvpdLW2Ef9DgMvaaWDT9MF7y0B4CBuTkgP3iAM13Dh4rOrxZds60Z2tZkezaEKeo',
        githubAccessToken: 'demo-token',
      });
      console.log('Demo user created.');
    } else {
      console.log('Demo user already exists.');
    }

    // Clean past demo resume/insights
    await Resume.deleteMany({ userId: user._id });
    await Insight.deleteMany({ userId: user._id });

    // Create a demo resume
    const resume = await Resume.create({
      userId: user._id,
      fileName: 'alex_rivera_resume.pdf',
      fileUrl: 'https://res.cloudinary.com/demo/image/upload/v1570975853/sample.pdf',
      rawMarkdown: `
# Alex Rivera
Senior Frontend Engineer | San Francisco, CA | arivera@gmail.com

## Summary
Experienced React Developer with 5+ years of experience building scalable user interfaces, optimizing loading performance, and managing small frontend development squads.

## Work Experience
### Frontend Dev Lead - TechCorp (2021 - Present)
- Worked on a React application for client management.
- Fixed bugs and improved performance of the dashboard.
- Collaborated with team members using Git and Slack.

### Frontend Engineer - WebStart (2019 - 2021)
- Built user interface views using Angular and JavaScript.
- Wrote unit testing validations for forms.
- Managed page optimization updates.

## Skills
- Languages: JavaScript, TypeScript, HTML/CSS
- Frameworks: React, Redux, Angular, Next.js
- Tools: Git, Webpack, Vite, JIRA
`,
    });
    console.log('Demo resume created.');

    // Create completed demo insight
    const insight = await Insight.create({
      userId: user._id,
      resumeId: resume._id,
      targetJobTitle: 'Senior React Developer @ Stripe',
      targetJobDescription: 'Build next-generation dashboard interfaces, optimize payment onboarding funnels, work with GraphQL, micro-frontends, and integrate telemetry.',
      includeGithub: true,
      status: 'completed',
      progress: 100,
      currentStage: 'Completed',
      executionLogs: [
        `[${new Date(Date.now() - 30000).toISOString()}] Job initialized and parsed.`,
        `[${new Date(Date.now() - 25000).toISOString()}] Audited GitHub repositories successfully.`,
        `[${new Date(Date.now() - 20000).toISOString()}] Building AI alignment templates...`,
        `[${new Date(Date.now() - 10000).toISOString()}] Querying Google Gemini API for match rate...`,
        `[${new Date(Date.now() - 2000).toISOString()}] Validating insights output structure...`,
        `[${new Date().toISOString()}] Analysis completed successfully.`
      ],
      analysis: {
        matchRate: 71,
        missingKeywords: [
          'GraphQL',
          'Micro-frontends',
          'Telemetry',
          'Onboarding funnels',
          'Stripe Elements',
          'Jest/RTL testing',
          'CI/CD Pipelines',
          'Web Performance Auditing'
        ],
        foundKeywords: [
          'React',
          'Redux',
          'TypeScript',
          'Next.js',
          'Vite',
          'Git',
          'Webpack',
          'Angular',
          'Form validations',
          'Dashboard UI',
          'Team leadership',
          'Performance optimization'
        ],
        suggestedBulletPoints: [
          {
            original: 'Worked on a React application for client management.',
            improved: 'Architected and built a high-traffic React/Redux client CRM, supporting 5,000+ daily active users and reducing state mutations bugs.',
            reason: 'Uses stronger action verbs and establishes clear developer scale metrics.'
          },
          {
            original: 'Fixed bugs and improved performance of the dashboard.',
            improved: 'Optimized frontend performance of the central dashboard, achieving a 40% speed increase in load times via code-splitting and memoization.',
            reason: 'Shows specific techniques used and quantifies the performance optimization achievements.'
          },
          {
            original: 'Collaborated with team members using Git and Slack.',
            improved: 'Championed Git-flow branching standards and code review practices across a 6-engineer squad, boosting delivery velocity by 15%.',
            reason: 'Highlights software development lifecycle leadership qualities over basic communications.'
          },
          {
            original: 'Built user interface views using Angular and JavaScript.',
            improved: 'Engineered 20+ responsive dashboard views utilizing Angular, streamlining enterprise data visualizations.',
            reason: 'Replaces generic "built views" with specific, impactful interface achievements.'
          }
        ],
        githubAudit: [
          {
            repoName: 'stripe-dashboard-clone',
            language: 'TypeScript',
            stars: 45,
            findings: [
              'Clean folder structure matching Next.js App Router architectures.',
              'Great code documentation inside README file, providing clear commands to run.',
              'High TypeScript coverage with strict mode configurations.'
            ]
          },
          {
            repoName: 'react-performance-utility',
            language: 'JavaScript',
            stars: 12,
            findings: [
              'Demonstrates advanced memoization practices and DOM rendering optimization hooks.',
              'Lacks code coverage metrics or unit tests. Consider adding Jest test specs.',
              'README is minimal. Adding configuration documentation would improve management score.'
            ]
          },
          {
            repoName: 'graphql-telemetry-demo',
            language: 'TypeScript',
            stars: 8,
            findings: [
              'Matches GraphQL target description requirement.',
              'Shows clean Apollo Client setup and request interceptors.',
              'No commit activity in the last 6 months. Refresh active commit pipelines.'
            ]
          }
        ],
        portfolioCritique: `Your profile displays robust frontend experience, particularly around core React ecosystems. You demonstrate strong technical expertise. However, your resume fails to highlight Stripe-relevant qualifications like GraphQL, micro-frontends, or payment integrations.

Your top repositories reflect good styling practices and TypeScript understanding. Adding active commit pipelines to your telemetry and GraphQL demo repo, along with test coverage, will significantly strengthen your profile.`,
        overallSummary: 'Strong React developer with 5+ years experience and great core coding capabilities. Gaps exist in micro-frontends, GraphQL, and test automation. Resolving these highlights will make you an elite candidate.'
      }
    });

    console.log('Demo completed Insight created. Seed successful!');
    console.log(`Insight ID: ${insight._id}`);
    mongoose.connection.close();
  } catch (error) {
    console.error('Seeding failed:', error);
    mongoose.connection.close();
    process.exit(1);
  }
};

runSeed();
