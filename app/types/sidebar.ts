export interface SidebarLinkItem {
  name: string;
  url: string;
  icon?: string;
}

export interface SidebarLinksWidget {
  id: string;
  type: "links";
  title: string;
  links: SidebarLinkItem[];
}

export interface SidebarHtmlWidget {
  id: string;
  type: "html";
  title: string;
  content: string;
}

export type SidebarWidget = SidebarLinksWidget | SidebarHtmlWidget;
