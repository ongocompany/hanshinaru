// site_menu 테이블 → Nav/Sidebar 트리 구조 변환
import { sbFetch } from './supabase';

interface MenuRow {
  id: number;
  section: string;
  label: string;
  path: string;
  parent_id: number | null;
  sort_order: number;
  is_top_menu: boolean;
  disabled: boolean;
}

export interface MenuItem {
  id: string;
  label: string;
  path: string;
  disabled?: boolean;
  children?: MenuItem[];
}

export interface SidebarItem {
  label: string;
  path: string;
  children?: SidebarItem[];
}

// DB에서 전체 메뉴 fetch
async function fetchAllMenus(): Promise<MenuRow[]> {
  return sbFetch<MenuRow>('site_menu', 'select=*&order=sort_order.asc');
}

// 탑 네비게이션 메뉴 빌드
export async function getTopMenu(): Promise<MenuItem[]> {
  const rows = await fetchAllMenus();

  // section별 그룹핑
  const sectionMap = new Map<string, MenuRow[]>();
  for (const r of rows) {
    const list = sectionMap.get(r.section) || [];
    list.push(r);
    sectionMap.set(r.section, list);
  }

  const result: MenuItem[] = [];
  const seenSections = new Set<string>();

  // sort_order 순으로 첫 번째 is_top_menu 아이템이 대표
  const topItems = rows
    .filter((r) => r.is_top_menu)
    .sort((a, b) => a.sort_order - b.sort_order);

  for (const item of topItems) {
    if (seenSections.has(item.section)) continue;
    seenSections.add(item.section);

    const sectionRows = sectionMap.get(item.section) || [];

    // dropdown children = 같은 section의 root-level 아이템 (대표 제외)
    const children = sectionRows
      .filter((r) => r.id !== item.id && r.parent_id === null)
      .sort((a, b) => a.sort_order - b.sort_order);

    const menuItem: MenuItem = {
      id: item.section,
      label: item.label,
      path: item.path,
      disabled: item.disabled || false,
    };

    if (children.length > 0) {
      menuItem.children = children.map((c) => ({
        id: String(c.id),
        label: c.label,
        path: c.path,
      }));
    }

    result.push(menuItem);
  }

  return result;
}

// 사이드바 메뉴 빌드 (section별)
export async function getSidebar(): Promise<Record<string, SidebarItem[]>> {
  const rows = await fetchAllMenus();
  const byId = new Map<number, MenuRow>();
  for (const r of rows) byId.set(r.id, r);

  // top menu 아이템 제외, 트리 구성
  const nonTop = rows.filter((r) => !r.is_top_menu);

  // section별 그룹
  const sections = new Map<string, MenuRow[]>();
  for (const r of nonTop) {
    const list = sections.get(r.section) || [];
    list.push(r);
    sections.set(r.section, list);
  }

  const result: Record<string, SidebarItem[]> = {};

  for (const [section, sectionRows] of sections) {
    // 루트 아이템 (parent_id가 null이거나 parent가 top menu인 것)
    const roots = sectionRows.filter((r) => {
      if (r.parent_id === null) return true;
      const parent = byId.get(r.parent_id);
      return parent && parent.is_top_menu;
    });

    result[section] = roots.map((r) => buildTree(r, sectionRows));
  }

  return result;
}

function buildTree(node: MenuRow, allRows: MenuRow[]): SidebarItem {
  const children = allRows
    .filter((r) => r.parent_id === node.id)
    .sort((a, b) => a.sort_order - b.sort_order);

  const item: SidebarItem = { label: node.label, path: node.path };
  if (children.length > 0) {
    item.children = children.map((c) => buildTree(c, allRows));
  }
  return item;
}
