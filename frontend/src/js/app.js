import CloudDashboard from './CloudDashBoard';

document.addEventListener('DOMContentLoaded', () => {
    const wrapper = document.getElementById('dashboard-app-wrapper');
    if (wrapper) {
        const dashboard = new CloudDashboard(wrapper);
        dashboard.init();
    }
});
