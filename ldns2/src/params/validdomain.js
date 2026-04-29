import psl from 'psl';

/** @type {import('@sveltejs/kit').ParamMatcher} */
export function match(param) {
    try {
        // Basic validation first
        if (!param || typeof param !== 'string' || param.length === 0) {
            return false;
        }
        
        // Check for obviously invalid characters
        if (param.includes(' ') || param.includes('\n') || param.includes('\t')) {
            return false;
        }
        
        // Use PSL to validate the domain
        return psl.isValid(param);
    } catch (error) {
        // If PSL throws an error, treat as invalid domain (404, not 500)
        console.warn('Domain validation error for param:', param, error);
        return false;
    }
}