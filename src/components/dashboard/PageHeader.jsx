import Breadcrumbs from "./Breadcrumbs";

/**
 * Consistent page title + breadcrumb, used automatically by DashboardLayout
 * above every page's content — individual pages don't need to render their
 * own title.
 */
export default function PageHeader({ icon, title, subtitle, crumbs, action }) {
  return (
    <div className="page-header">
      <div className="page-header-top">
        <div className="page-header-heading">
          {icon && <span className="page-header-icon">{icon}</span>}
          <div>
            <h1 className="page-header-title">{title}</h1>
            {subtitle && <p className="page-header-subtitle">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="page-header-action">{action}</div>}
      </div>
      <Breadcrumbs crumbs={crumbs} />
    </div>
  );
}
