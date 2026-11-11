import type { ElementType } from 'react'
import { BookOpen, Calendar, ClipboardList } from 'lucide-react'
import type { Role } from '@/types'

export interface NavItemConfig {
  label: string
  href: string
  icon: ElementType
  end?: boolean
}

export const STUDENT_NAV_ITEMS: NavItemConfig[] = [
  {
    label: 'Assignments',
    href: '/student',
    icon: ClipboardList,
    end: true,
  },
  {
    label: 'Calendar',
    href: '/student/calendar',
    icon: Calendar,
  },
]

export const ADMIN_NAV_ITEMS: NavItemConfig[] = [
  {
    label: 'Courses',
    href: '/admin',
    icon: BookOpen,
  },
  {
    label: 'Calendar',
    href: '/admin/calendar',
    icon: Calendar,
  },
]

export function getNavItemsForRole(role: Role): NavItemConfig[] {
  return role === 'admin' ? ADMIN_NAV_ITEMS : STUDENT_NAV_ITEMS
}
