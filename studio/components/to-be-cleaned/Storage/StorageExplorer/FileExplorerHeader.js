import React, { useState, useEffect, useCallback, useRef } from 'react'
import { compact, debounce, isEqual } from 'lodash'
import {
  Button,
  Dropdown,
  Input,
  IconChevronLeft,
  IconChevronRight,
  IconRefreshCw,
  IconColumns,
  IconChevronsDown,
  IconSearch,
  IconFolderPlus,
  IconUpload,
  IconX,
  IconEdit2,
  IconLoader,
  Typography,
} from '@supabase/ui'
import { STORAGE_VIEWS, STORAGE_SORT_BY } from '../Storage.constants.ts'

const HeaderPathEdit = ({ loading, breadcrumbs, togglePathEdit }) => {
  return (
    <div
      className={`group ${!loading ? 'cursor-pointer' : ''}`}
      onClick={() => (!loading.isLoading ? togglePathEdit() : {})}
    >
      {loading.isLoading ? (
        <div className="ml-2 flex items-center">
          <Typography.Text>
            <IconLoader size={16} strokeWidth={2} className="animate-spin" />
          </Typography.Text>
          <Typography.Text>
            <p className="text-sm ml-3">{loading.message}</p>
          </Typography.Text>
        </div>
      ) : (
        <div className="cursor-pointer flex items-center">
          <Typography.Text>
            <p className="text-sm ml-3">{breadcrumbs[breadcrumbs.length - 1] || ''}</p>
          </Typography.Text>
          <div className="ml-3 space-x-2 flex items-center transition opacity-0 group-hover:opacity-100">
            <Button type="text" icon={<IconEdit2 />}>
              Navigate
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

const HeaderBreadcrumbs = ({ loading, breadcrumbs, selectBreadcrumb }) => {
  // Max 5 crumbs, otherwise replace middle segment with ellipsis and only
  // have the first 2 and last 2 crumbs visible
  const ellipsis = '...'
  const breadcrumbsWithIndexes = breadcrumbs.map((name, index) => {
    return { name, index }
  })

  const formattedBreadcrumbs =
    breadcrumbsWithIndexes.length <= 5
      ? breadcrumbsWithIndexes
      : breadcrumbsWithIndexes
          .slice(0, 2)
          .concat([{ name: ellipsis, index: -1 }])
          .concat(
            breadcrumbsWithIndexes.slice(
              breadcrumbsWithIndexes.length - 2,
              breadcrumbsWithIndexes.length
            )
          )

  return loading.isLoading ? (
    <div className="ml-2 flex items-center">
      <Typography.Text>
        <IconLoader size={16} strokeWidth={2} className="animate-spin" />
      </Typography.Text>
      <Typography.Text>
        <p className="text-sm ml-3">{loading.message}</p>
      </Typography.Text>
    </div>
  ) : (
    <div className="flex items-center ml-3">
      {formattedBreadcrumbs.map((crumb, idx) => (
        <div className="flex items-center" key={crumb.name}>
          {idx !== 0 && (
            <Typography.Text>
              <IconChevronRight size={10} strokeWidth={2} className="mx-3" />
            </Typography.Text>
          )}
          <Typography.Text>
            <p
              key={crumb.name}
              className={`text-sm truncate ${crumb.name !== ellipsis ? 'cursor-pointer' : ''}`}
              style={{ maxWidth: '6rem' }}
              onClick={() => (crumb.name !== ellipsis ? selectBreadcrumb(crumb.index) : {})}
            >
              {crumb.name}
            </p>
          </Typography.Text>
        </div>
      ))}
    </div>
  )
}

const FileExplorerHeader = ({
  view = STORAGE_VIEWS.COLUMNS,
  sortBy = STORAGE_SORT_BY.NAME,
  loading = {},
  breadcrumbs = [],
  backDisabled = false,
  isSearching = false,
  itemSearchString = '',
  setItemSearchString = () => {},
  onSetPathByString = () => {},
  onChangeView = () => {},
  onChangeSortBy = () => {},
  onToggleSearch = () => {},
  onFilesUpload = () => {},
  onSelectBack = () => {},
  onSelectCreateFolder = () => {},
  onSelectBreadcrumb = () => {},
}) => {
  const debounceDuration = 300
  const [isEditingPath, setIsEditingPath] = useState(false)
  const [pathString, setPathString] = useState('')
  const [searchString, setSearchString] = useState('')

  const uploadButtonRef = useRef(null)
  const previousBreadcrumbs = useRef(null)

  useEffect(() => {
    if (itemSearchString) setSearchString(itemSearchString)
  }, [])

  useEffect(() => {
    // [Joshen] Somehow toggle search triggers this despite breadcrumbs
    // being unchanged. Manually doing a prop check to fix this
    if (!isEqual(previousBreadcrumbs.current, breadcrumbs)) {
      setIsEditingPath(false)
      previousBreadcrumbs.current = breadcrumbs
    }
  }, [breadcrumbs])

  const searchInputHandler = useCallback(debounce(setItemSearchString, debounceDuration), [])
  const onSearchInputUpdate = (event) => {
    setSearchString(event.target.value)
    searchInputHandler(event.target.value)
  }

  const onSelectUpload = () => {
    if (uploadButtonRef.current) {
      uploadButtonRef.current.click()
    }
  }

  /** Methods for path editings */
  const togglePathEdit = () => {
    setIsEditingPath(true)
    setPathString(breadcrumbs.slice(1).join('/'))
    if (isSearching) onCancelSearch()
  }

  const onUpdatePathString = (event) => {
    setPathString(event.target.value)
  }

  const navigateByPathString = (event) => {
    if (event) {
      event.preventDefault()
      event.stopPropagation()
    }
    setIsEditingPath(false)
    onSetPathByString(compact(pathString.split('/')))
  }

  const cancelSetPathString = () => {
    setIsEditingPath(false)
  }

  /** Methods for searching */
  // Search is currently within local scope when the view is set to list
  // Searching for column view requires much more thinking
  const toggleSearch = () => {
    setIsEditingPath(false)
    onToggleSearch(true)
  }
  const onCancelSearch = () => {
    setSearchString('')
    onToggleSearch(false)
  }

  /** Methods for breadcrumbs */

  const selectBreadcrumb = (columnIndex) => {
    onSelectBreadcrumb(columnIndex)
  }

  function refreshData() {
    PageState.fetchData(1)
  }

  return (
    <div
      className="
    bg-panel-header-light dark:bg-panel-header-dark
    border-b border-panel-border-light dark:border-panel-border-dark
    px-3 h-[40px] flex rounded-t-md items-center justify-between z-10"
    >
      {/* Navigation */}
      <div className={`flex items-center ${isEditingPath ? 'w-1/2' : ''}`}>
        {breadcrumbs.length > 0 && (
          <Button
            icon={<IconChevronLeft size={16} strokeWidth={1} />}
            size="tiny"
            type="text"
            className={breadcrumbs.length > 1 ? 'opacity-100' : 'opacity-25'}
            disabled={backDisabled}
            onClick={() => {
              setIsEditingPath(false)
              onSelectBack()
            }}
          />
        )}
        {isEditingPath ? (
          <form className="ml-2 flex-grow">
            <Input
              autoFocus
              key="pathSet"
              type="text"
              value={pathString}
              onChange={onUpdatePathString}
              placeholder="e.g Parent Folder/Child Folder"
              actions={[
                <Button
                  key="cancelPath"
                  type="default"
                  htmlType="button"
                  onClick={cancelSetPathString}
                >
                  Cancel
                </Button>,
                <Button
                  key="setPath"
                  type="primary"
                  htmlType="submit"
                  onClick={navigateByPathString}
                >
                  Go to folder
                </Button>,
              ]}
            />
          </form>
        ) : view === STORAGE_VIEWS.COLUMNS ? (
          <HeaderPathEdit
            loading={loading}
            breadcrumbs={breadcrumbs}
            togglePathEdit={togglePathEdit}
          />
        ) : (
          <HeaderBreadcrumbs
            loading={loading}
            breadcrumbs={breadcrumbs}
            selectBreadcrumb={selectBreadcrumb}
          />
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-1">
          <Button
            className="mr-2"
            size="tiny"
            icon={<IconRefreshCw />}
            type="text"
            loading={PageState.usersLoading}
            onClick={refreshData}
          >
            Reload
          </Button>
          <Dropdown
            overlay={[
              <Dropdown.RadioGroup key="viewOptions" value={view} onChange={onChangeView}>
                <Dropdown.Radio value={STORAGE_VIEWS.COLUMNS}>Columns</Dropdown.Radio>
                <Dropdown.Radio value={STORAGE_VIEWS.LIST}>List</Dropdown.Radio>
              </Dropdown.RadioGroup>,
            ]}
          >
            <Button
              as="span"
              icon={<IconColumns size={16} strokeWidth={2} />}
              type="text"
              disabled={breadcrumbs.length === 0}
            >
              Views
            </Button>
          </Dropdown>
          <Dropdown
            overlay={[
              <Dropdown.RadioGroup key="sortOptions" value={sortBy} onChange={onChangeSortBy}>
                <Dropdown.Radio value={STORAGE_SORT_BY.NAME}>Sort by name</Dropdown.Radio>
                <Dropdown.Radio value={STORAGE_SORT_BY.CREATED_AT}>
                  Sort by last created
                </Dropdown.Radio>
                <Dropdown.Radio value={STORAGE_SORT_BY.UPDATED_AT}>
                  Sort by last modified
                </Dropdown.Radio>
                <Dropdown.Radio value={STORAGE_SORT_BY.LAST_ACCESSED_AT}>
                  Sort by last accessed
                </Dropdown.Radio>
              </Dropdown.RadioGroup>,
            ]}
          >
            <Button
              as="span"
              icon={<IconChevronsDown size={16} strokeWidth={2} />}
              type="text"
              disabled={breadcrumbs.length === 0}
            >
              Sort
            </Button>
          </Dropdown>
        </div>
        <div className="border-r border-panel-border-light dark:border-panel-border-dark h-6" />
        <div className="flex items-center space-x-1">
          <div className="hidden">
            <input ref={uploadButtonRef} type="file" multiple onChange={onFilesUpload} />
          </div>
          <Button
            icon={<IconUpload size={16} strokeWidth={2} />}
            type="text"
            disabled={breadcrumbs.length === 0}
            onClick={onSelectUpload}
          >
            Upload file
          </Button>
          <Button
            icon={<IconFolderPlus size={16} strokeWidth={2} />}
            type="text"
            disabled={breadcrumbs.length === 0}
            onClick={() => onSelectCreateFolder()}
          >
            Create folder
          </Button>
        </div>

        {/* Search: Disabled for now */}
        {view === STORAGE_VIEWS.LIST && (
          <>
            <div className="border-r border-panel-border-light dark:border-panel-border-dark h-6" />
            <div className="flex items-center">
              {isSearching ? (
                <Input
                  size="tiny"
                  autoFocus
                  className="w-64"
                  icon={<IconSearch size={'tiny'} strokeWidth={2} />}
                  actions={[
                    <IconX
                      key="close"
                      className="text-white cursor-pointer mx-2"
                      size={'tiny'}
                      strokeWidth={2}
                      onClick={onCancelSearch}
                    />,
                  ]}
                  placeholder="Search for a file or folder"
                  type="text"
                  value={searchString}
                  onChange={onSearchInputUpdate}
                />
              ) : (
                <Button
                  icon={<IconSearch size={16} strokeWidth={2} />}
                  size="tiny"
                  type="text"
                  onClick={toggleSearch}
                />
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default FileExplorerHeader
