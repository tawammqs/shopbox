import type { ComponentType } from 'react'

export interface TemplateEntry {
  component: ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  displayName?: string
  previewData?: Record<string, any>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

import { template as welcomeTemplate } from './welcome'
import { template as cartRecoveryTemplate } from './cart-recovery'
import { template as newOrderStoreTemplate } from './new-order-store'
import { template as orderConfirmationCustomerTemplate } from './order-confirmation-customer'

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  welcome: welcomeTemplate,
  'cart-recovery': cartRecoveryTemplate,
  'new-order-store': newOrderStoreTemplate,
  'order-confirmation-customer': orderConfirmationCustomerTemplate,
}
