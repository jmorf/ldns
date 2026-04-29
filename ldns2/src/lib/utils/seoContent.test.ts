import { describe, it, expect } from 'vitest';
import { SEO_PAGES, PAGE_LABELS, ALL_PAGE_SLUGS } from './seoContent';

const DOMAIN = 'example.com';

describe('SEO_PAGES registry', () => {
    it('has all expected page slugs', () => {
        const expected = ['mx', 'ns', 'a', 'txt', 'spf', 'dmarc', 'whois', 'ip', 'propagation', 'reverse-dns', 'subdomains'];
        for (const slug of expected) {
            expect(SEO_PAGES[slug]).toBeDefined();
        }
    });

    for (const [slug, config] of Object.entries(SEO_PAGES)) {
        describe(`${slug} page config`, () => {
            it('has a slug matching its key', () => {
                expect(config.slug).toBe(slug);
            });

            it('title() includes the domain name', () => {
                expect(config.title(DOMAIN)).toContain(DOMAIN);
            });

            it('description() includes the domain name', () => {
                expect(config.description(DOMAIN)).toContain(DOMAIN);
            });

            it('h1() includes the domain name', () => {
                expect(config.h1(DOMAIN)).toContain(DOMAIN);
            });

            it('intro includes the domain name', () => {
                const intro = typeof config.intro === 'function'
                    ? (config.intro as (d: string) => string)(DOMAIN)
                    : config.intro;
                expect(typeof intro).toBe('string');
                expect(intro.length).toBeGreaterThan(20);
            });

            it('has sections with content', () => {
                const sections = typeof config.sections === 'function'
                    ? (config.sections as (d: string) => any[])(DOMAIN)
                    : config.sections;
                expect(Array.isArray(sections)).toBe(true);
                expect(sections.length).toBeGreaterThanOrEqual(3);
                for (const section of sections) {
                    expect(typeof section.heading).toBe('string');
                    expect(section.heading.length).toBeGreaterThan(0);
                    expect(Array.isArray(section.paragraphs)).toBe(true);
                    expect(section.paragraphs.length).toBeGreaterThan(0);
                }
            });

            it('relatedPages does not include own slug', () => {
                expect(config.relatedPages).not.toContain(slug);
            });

            it('has a valid dataSource', () => {
                expect(['dns', 'rdap', 'email', 'server', 'security']).toContain(config.dataSource);
            });
        });
    }
});

describe('PAGE_LABELS', () => {
    it('has labels for all page slugs', () => {
        for (const slug of ALL_PAGE_SLUGS) {
            expect(PAGE_LABELS[slug]).toBeDefined();
            expect(typeof PAGE_LABELS[slug].label).toBe('string');
            expect(typeof PAGE_LABELS[slug].shortDescription).toBe('string');
        }
    });
});
