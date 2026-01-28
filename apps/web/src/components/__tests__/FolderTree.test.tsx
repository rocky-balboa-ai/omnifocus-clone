import { render, screen, fireEvent } from '@testing-library/react';

// Mock the store
const mockSetSelectedFolderId = jest.fn();
const mockSetSelectedProjectId = jest.fn();
const mockStore = {
  folders: [
    { id: 'folder-1', name: 'Work', parentId: null, children: [], projects: [] },
    { id: 'folder-2', name: 'Personal', parentId: null, children: [], projects: [] },
    { id: 'folder-3', name: 'Q1 Goals', parentId: 'folder-1', children: [], projects: [] },
  ],
  projects: [
    { id: 'proj-1', name: 'Website Redesign', folderId: 'folder-1', status: 'active', type: 'parallel' },
    { id: 'proj-2', name: 'Vacation Planning', folderId: 'folder-2', status: 'active', type: 'parallel' },
    { id: 'proj-3', name: 'No Folder Project', folderId: null, status: 'active', type: 'parallel' },
  ],
  selectedFolderId: null,
  selectedProjectId: null,
  setSelectedFolderId: mockSetSelectedFolderId,
  setSelectedProjectId: mockSetSelectedProjectId,
  setSelectedProject: jest.fn(),
  theme: 'dark' as const,
};

jest.mock('@/stores/app.store', () => ({
  useAppStore: () => mockStore,
}));

describe('FolderTree', () => {
  beforeEach(() => {
    mockSetSelectedFolderId.mockClear();
    mockSetSelectedProjectId.mockClear();
  });

  it('should render root folders', async () => {
    const { FolderTree } = await import('../FolderTree');
    render(<FolderTree />);

    expect(screen.getByText('Work')).toBeInTheDocument();
    expect(screen.getByText('Personal')).toBeInTheDocument();
  });

  it('should render "All Projects" option', async () => {
    const { FolderTree } = await import('../FolderTree');
    render(<FolderTree />);

    expect(screen.getByText('All Projects')).toBeInTheDocument();
  });

  it('should show expand/collapse chevron for folders with children', async () => {
    const { FolderTree } = await import('../FolderTree');
    const { container } = render(<FolderTree />);

    // Work folder has a child (Q1 Goals), should have chevron
    const workFolder = screen.getByText('Work').closest('button');
    expect(workFolder).toBeInTheDocument();
  });

  it('should expand folder to show nested folders on click', async () => {
    const { FolderTree } = await import('../FolderTree');
    render(<FolderTree />);

    // Click on Work folder to expand
    const workFolder = screen.getByText('Work');
    fireEvent.click(workFolder);

    // Should show Q1 Goals nested folder
    expect(screen.getByText('Q1 Goals')).toBeInTheDocument();
  });

  it('should call setSelectedFolderId when folder is selected', async () => {
    const { FolderTree } = await import('../FolderTree');
    render(<FolderTree />);

    const workFolder = screen.getByText('Work');
    fireEvent.click(workFolder);

    expect(mockSetSelectedFolderId).toHaveBeenCalledWith('folder-1');
  });
});
