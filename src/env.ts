import {z} from "zod"


const envSchema = z.object({
    COMPANY_NAME: z.string(),
    TWITTER_CREATOR:  z.string(),
    TWITTER_SITE: z.string() , 
    SITE_NAME:  z.string(),
    SHOPIFY_REVALIDATION_SECRET:  z.string(), 
    SHOPIFY_STOREFRONT_ACCESS_TOKEN:  z.string(), 
    SHOPIFY_STORE_DOMAIN:  z.string() 
})

// If any are missing or invalid, the app will crash immediately.
const parsedEnv = envSchema.parse(process.env);

export const env = parsedEnv;