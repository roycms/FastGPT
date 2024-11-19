// Navbar.tsx
import React from 'react';

const Navbar: React.FC = () => {
  return (
    <header className="hui-nav-wrapper">
      <div className="hui-nav-bar hui-nav-black hui-nav-fixed-top">
        <div className="hui-layout-content clearfix">
          <a className="hui-logo hidden-xs" href="#">
            华链智能Agent开发平台
          </a>
          <a className="hui-logo visible-xs" href="#">
            H-ui
          </a>
          <span className="hui-logo hui-slogan hidden-xs">
            简单 &middot; 智能 &middot; AI全场景落地
          </span>

          <nav
            className="hui-nav hui-nav-collapse"
            style={{ float: 'left', display: 'flex', flex: '1 1 0%' }}
          >
            <ul className="clearfix">
              <li className="current">
                <a href="">首页</a>
              </li>
              <li>
                <a href="#">模型管理</a>
              </li>
              <li>
                <a href="#">模型微调</a>
              </li>
              <li>
                <a href="#">数据管理</a>
              </li>
              <li>
                <a href="#">AI课程服务</a>
              </li>
              {/* ... 其他菜单项 ... */}
            </ul>
          </nav>
          <nav className="hui-nav hidden-xs" style={{ float: 'right' }}>
            <ul className="clearfix">
              <li>
                <a href="/account?currentTab=apikey">API文档</a>
              </li>
              <li>
                <a href="/account">用户中心</a>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </header>
  );
};

export default Navbar;
