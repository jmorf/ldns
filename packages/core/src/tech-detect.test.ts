import { describe, it, expect } from 'vitest';
import { detectTechnologies } from './tech-detect';

describe('detectTechnologies', () => {
  it('should detect Cloudflare from cf-ray header', () => {
    const result = detectTechnologies({ 'cf-ray': '12345-IAD' });
    expect(result).toContainEqual({ name: 'Cloudflare', category: 'cdn' });
  });

  it('should detect Cloudflare from server header', () => {
    const result = detectTechnologies({ 'server': 'cloudflare' });
    expect(result).toContainEqual({ name: 'Cloudflare', category: 'cdn' });
  });

  it('should detect Vercel from x-vercel-id header', () => {
    const result = detectTechnologies({ 'x-vercel-id': 'iad1::abc123' });
    expect(result).toContainEqual({ name: 'Vercel', category: 'platform' });
  });

  it('should detect nginx from server header', () => {
    const result = detectTechnologies({ 'server': 'nginx/1.24.0' });
    expect(result).toContainEqual({ name: 'nginx', category: 'server' });
  });

  it('should detect Apache from server header', () => {
    const result = detectTechnologies({ 'server': 'Apache/2.4.52' });
    expect(result).toContainEqual({ name: 'Apache', category: 'server' });
  });

  it('should detect Next.js from x-powered-by header', () => {
    const result = detectTechnologies({ 'x-powered-by': 'Next.js' });
    expect(result).toContainEqual({ name: 'Next.js', category: 'framework' });
  });

  it('should detect Express.js from x-powered-by header', () => {
    const result = detectTechnologies({ 'x-powered-by': 'Express' });
    expect(result).toContainEqual({ name: 'Express.js', category: 'framework' });
  });

  it('should detect PHP from x-powered-by header', () => {
    const result = detectTechnologies({ 'x-powered-by': 'PHP/8.2.0' });
    expect(result).toContainEqual({ name: 'PHP', category: 'framework' });
  });

  it('should detect CloudFront from x-amz-cf-id header', () => {
    const result = detectTechnologies({ 'x-amz-cf-id': 'abc123' });
    expect(result).toContainEqual({ name: 'CloudFront', category: 'cdn' });
  });

  it('should detect CloudFront from x-cache header', () => {
    const result = detectTechnologies({ 'x-cache': 'Hit from cloudfront' });
    expect(result).toContainEqual({ name: 'CloudFront', category: 'cdn' });
  });

  it('should detect Shopify from x-shopify-stage header', () => {
    const result = detectTechnologies({ 'x-shopify-stage': 'production' });
    expect(result).toContainEqual({ name: 'Shopify', category: 'platform' });
  });

  it('should detect GitHub Pages from x-github-request-id header', () => {
    const result = detectTechnologies({ 'x-github-request-id': 'abc:123' });
    expect(result).toContainEqual({ name: 'GitHub Pages', category: 'platform' });
  });

  it('should detect WordPress from x-pingback header', () => {
    const result = detectTechnologies({ 'x-pingback': 'https://example.com/xmlrpc.php' });
    expect(result).toContainEqual({ name: 'WordPress', category: 'platform' });
  });

  it('should detect Heroku from via header', () => {
    const result = detectTechnologies({ 'via': '1.1 vegur' });
    expect(result).toContainEqual({ name: 'Heroku', category: 'hosting' });
  });

  it('should detect Fly.io from x-fly-request-id header', () => {
    const result = detectTechnologies({ 'x-fly-request-id': '01abc' });
    expect(result).toContainEqual({ name: 'Fly.io', category: 'hosting' });
  });

  it('should detect Render from x-render-origin-server header', () => {
    const result = detectTechnologies({ 'x-render-origin-server': 'Render' });
    expect(result).toContainEqual({ name: 'Render', category: 'hosting' });
  });

  it('should detect Fastly from fastly-debug-digest header', () => {
    const result = detectTechnologies({ 'fastly-debug-digest': 'abc123' });
    expect(result).toContainEqual({ name: 'Fastly', category: 'cdn' });
  });

  it('should detect Akamai from x-true-cache-key header', () => {
    const result = detectTechnologies({ 'x-true-cache-key': '/example.com/' });
    expect(result).toContainEqual({ name: 'Akamai', category: 'cdn' });
  });

  it('should detect ASP.NET from x-aspnet-version header', () => {
    const result = detectTechnologies({ 'x-aspnet-version': '4.0.30319' });
    expect(result).toContainEqual({ name: 'ASP.NET', category: 'framework' });
  });

  it('should detect Drupal from x-drupal-cache header', () => {
    const result = detectTechnologies({ 'x-drupal-cache': 'HIT' });
    expect(result).toContainEqual({ name: 'Drupal', category: 'framework' });
  });

  it('should detect Google Web Server from server header', () => {
    const result = detectTechnologies({ 'server': 'gws' });
    expect(result).toContainEqual({ name: 'Google Web Server', category: 'server' });
  });

  it('should detect Amazon S3 from server header', () => {
    const result = detectTechnologies({ 'server': 'AmazonS3' });
    expect(result).toContainEqual({ name: 'Amazon S3', category: 'server' });
  });

  it('should detect multiple technologies', () => {
    const result = detectTechnologies({
      'cf-ray': '12345',
      'x-powered-by': 'Next.js',
      'server': 'cloudflare'
    });
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result).toContainEqual({ name: 'Cloudflare', category: 'cdn' });
    expect(result).toContainEqual({ name: 'Next.js', category: 'framework' });
  });

  it('should deduplicate same technology from multiple headers', () => {
    const result = detectTechnologies({
      'cf-ray': '12345',
      'cf-cache-status': 'HIT',
      'server': 'cloudflare'
    });
    const cloudflareResults = result.filter(t => t.name === 'Cloudflare');
    expect(cloudflareResults).toHaveLength(1);
  });

  it('should return empty array for no matching headers', () => {
    const result = detectTechnologies({ 'content-type': 'text/html' });
    expect(result).toHaveLength(0);
  });

  it('should return empty array for empty headers', () => {
    const result = detectTechnologies({});
    expect(result).toHaveLength(0);
  });

  it('should handle case-insensitive header keys', () => {
    const result = detectTechnologies({ 'CF-Ray': '12345' });
    expect(result).toContainEqual({ name: 'Cloudflare', category: 'cdn' });
  });

  it('should detect Wix from x-wix-request-id header', () => {
    const result = detectTechnologies({ 'x-wix-request-id': '1234' });
    expect(result).toContainEqual({ name: 'Wix', category: 'platform' });
  });

  it('should detect Squarespace from x-squarespace-did header', () => {
    const result = detectTechnologies({ 'x-squarespace-did': 'abc' });
    expect(result).toContainEqual({ name: 'Squarespace', category: 'platform' });
  });

  it('should detect AWS S3 from x-amz-request-id header', () => {
    const result = detectTechnologies({ 'x-amz-request-id': 'abc' });
    expect(result).toContainEqual({ name: 'AWS S3', category: 'hosting' });
  });
});
