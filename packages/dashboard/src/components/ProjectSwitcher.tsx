import { Select, Typography } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '../api/project';
import { useCurrentProject } from '../hooks/useCurrentProject';
import { useEffect } from 'react';

export function ProjectSwitcher() {
  const { projectId, setProjectId } = useCurrentProject();
  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: getProjects,
  });

  useEffect(() => {
    if (projects && projects.length > 0 && !projectId) {
      setProjectId(projects[0].id);
    }
  }, [projects, projectId, setProjectId]);

  if (!projects || projects.length === 0) {
    return <Typography.Text type="secondary">暂无项目</Typography.Text>;
  }

  return (
    <Select
      value={projectId ?? undefined}
      onChange={setProjectId}
      loading={isLoading}
      style={{ width: 200 }}
      size="small"
      options={projects.map((p) => ({ label: p.name, value: p.id }))}
      placeholder="选择项目"
    />
  );
}
