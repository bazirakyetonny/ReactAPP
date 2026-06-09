import type { CategoryTemplates } from '../types';
import type { SDTAppVersion } from '../services/appVersionsApi';
import { CreateAppVersionModal } from './appversion/CreateAppVersionModal';
import { RenameAppVersionModal } from './appversion/RenameAppVersionModal';
import { MoveToTrashModal } from './appversion/MoveToTrashModal';
import { DuplicateAppVersionModal } from './appversion/DuplicateAppVersionModal';
import { UpdateTranslationsModal } from './appversion/UpdateTranslationsModal';
import { UpdateDescriptionModal } from './appversion/UpdateDescriptionModal';
import { TemplatePublishModal } from './appversion/TemplatePublishModal';
import { CreateAppVersionTemplateModal } from './appversion/CreateAppVersionTemplateModal';
import { PublishModal } from './appversion/PublishModal';
import { ShareLinkModal } from './appversion/ShareLinkModal';
import { TrashModal } from './appversion/TrashModal';
import { AddCtaModal } from './phone/AddCtaModal';
import { TileImageModal } from './phone/TileImageModal';

interface EditorModalsProps {
  showPublishModal: boolean;
  showPublishAsTemplateModal: boolean;
  onClosePublishAsTemplate: () => void;
  onTemplatePublished: () => void;
  showUnpublishTemplateModal: boolean;
  onCloseUnpublishTemplate: () => void;
  onTemplateUnpublished: () => void;
  currentVersion: any;
  appVersions: SDTAppVersion[];
  analysisIssueCount: number;
  onPublished: () => void;
  onClosePublish: () => void;
  onFixIssues: () => void;

  showShareModal: boolean;
  shareLink: string;
  onCloseShare: () => void;

  showCreateModal: boolean;
  templatesCollection: CategoryTemplates[];
  themeColors?: any;
  themeIcons?: any[];
  onCloseCreate: () => void;
  onVersionCreated: (version: any) => Promise<void>;

  showCreateTemplateModal: boolean;
  onCloseCreateTemplate: () => void;
  onTemplateCreated: () => void;

  renameVersion: SDTAppVersion | null;
  onCloseRename: () => void;
  onVersionRenamed: (newName: string) => void;

  trashVersion: SDTAppVersion | null;
  onCloseTrash: () => void;
  onVersionDeleted: () => void;

  duplicateVersion: SDTAppVersion | null;
  onCloseDuplicate: () => void;
  onVersionDuplicated: () => void;

  updateDescriptionVersion: SDTAppVersion | null;
  onCloseUpdateDescription: () => void;
  onDescriptionUpdated: () => void;

  updateTranslationsVersion: (SDTAppVersion & { TranslateLanguages?: string[] }) | null;
  onCloseUpdateTranslations: () => void;
  onTranslationsUpdated: () => void;

  tileImageModal: {
    tileWidth: number;
    tileHeight: number;
    initialOriginalUrl?: string;
    initialOpacity?: string;
  } | null;
  onTileImageConfirm: (result: {
    bgImageUrl: string;
    opacity: string;
    originalImageUrl: string;
    originalMediaId: string;
  }) => void;
  onCloseTileImage: () => void;

  showTrashModal: boolean;
  onCloseTrashModal: () => void;
  onTrashChanged: () => void;

  pendingCta: {
    blockType: string;
    insertBeforeInfoId: string | null;
    frameId: string | null;
  } | null;
  onConfirmCta: (attrs: {
    CtaLabel: string;
    CtaAction: string;
    CtaConnectedSupplierId?: string;
    CtaSupplierIsConnected: boolean;
  }) => void;
  onCancelCta: () => void;
}

export function EditorModals({
  showPublishModal, currentVersion, appVersions, analysisIssueCount,
  onPublished, onClosePublish, onFixIssues,
  showPublishAsTemplateModal, onClosePublishAsTemplate, onTemplatePublished,
  showUnpublishTemplateModal, onCloseUnpublishTemplate, onTemplateUnpublished,
  showShareModal, shareLink, onCloseShare,
  showCreateModal, templatesCollection, themeColors, themeIcons,
  onCloseCreate, onVersionCreated,
  showCreateTemplateModal, onCloseCreateTemplate, onTemplateCreated,
  renameVersion, onCloseRename, onVersionRenamed,
  trashVersion, onCloseTrash, onVersionDeleted,
  duplicateVersion, onCloseDuplicate, onVersionDuplicated,
  updateDescriptionVersion, onCloseUpdateDescription, onDescriptionUpdated,
  updateTranslationsVersion, onCloseUpdateTranslations, onTranslationsUpdated,
  showTrashModal, onCloseTrashModal, onTrashChanged,
  tileImageModal, onTileImageConfirm, onCloseTileImage,
  pendingCta, onConfirmCta, onCancelCta,
}: EditorModalsProps) {
  return (
    <>
      {showPublishModal && currentVersion && (
        <PublishModal
          currentVersionId={currentVersion.AppVersionId}
          currentVersionName={currentVersion.AppVersionName}
          appVersions={appVersions}
          issueCount={analysisIssueCount}
          onPublished={onPublished}
          onClose={onClosePublish}
          onFixIssues={onFixIssues}
        />
      )}
      {showShareModal && (
        <ShareLinkModal shareLink={shareLink} onClose={onCloseShare} />
      )}
      {showPublishAsTemplateModal && currentVersion && (
        <TemplatePublishModal
          mode="publish"
          versionId={currentVersion.AppVersionId}
          onConfirmed={onTemplatePublished}
          onClose={onClosePublishAsTemplate}
        />
      )}
      {showUnpublishTemplateModal && currentVersion && (
        <TemplatePublishModal
          mode="unpublish"
          versionId={currentVersion.AppVersionId}
          onConfirmed={onTemplateUnpublished}
          onClose={onCloseUnpublishTemplate}
        />
      )}
      {showCreateModal && (
        <CreateAppVersionModal
          templatesCollection={templatesCollection}
          themeColors={themeColors}
          themeIcons={themeIcons ?? []}
          onClose={onCloseCreate}
          onCreated={onVersionCreated}
        />
      )}
      {showCreateTemplateModal && (
        <CreateAppVersionTemplateModal
          onClose={onCloseCreateTemplate}
          onCreated={onTemplateCreated}
        />
      )}
      {renameVersion && (
        <RenameAppVersionModal
          key={renameVersion.AppVersionId}
          versionId={renameVersion.AppVersionId}
          currentName={renameVersion.AppVersionName}
          currentDescription={renameVersion.AppVersionDescription}
          onClose={onCloseRename}
          onRenamed={onVersionRenamed}
        />
      )}
      {trashVersion && (
        <MoveToTrashModal
          key={trashVersion.AppVersionId}
          versionId={trashVersion.AppVersionId}
          versionName={trashVersion.AppVersionName}
          onClose={onCloseTrash}
          onDeleted={onVersionDeleted}
        />
      )}
      {duplicateVersion && (
        <DuplicateAppVersionModal
          key={duplicateVersion.AppVersionId}
          versionId={duplicateVersion.AppVersionId}
          currentName={duplicateVersion.AppVersionName}
          onClose={onCloseDuplicate}
          onDuplicated={onVersionDuplicated}
        />
      )}
      {updateDescriptionVersion && (
        <UpdateDescriptionModal
          key={updateDescriptionVersion.AppVersionId}
          versionId={updateDescriptionVersion.AppVersionId}
          currentName={updateDescriptionVersion.AppVersionName}
          currentDescription={updateDescriptionVersion.AppVersionDescription}
          onClose={onCloseUpdateDescription}
          onUpdated={onDescriptionUpdated}
        />
      )}
      {updateTranslationsVersion && (
        <UpdateTranslationsModal
          key={updateTranslationsVersion.AppVersionId}
          versionId={updateTranslationsVersion.AppVersionId}
          versionName={updateTranslationsVersion.AppVersionName}
          baseLanguage={updateTranslationsVersion.AppVersionLanguage}
          currentTranslateLanguages={updateTranslationsVersion.TranslateLanguages}
          onClose={onCloseUpdateTranslations}
          onUpdated={onTranslationsUpdated}
        />
      )}
      {showTrashModal && (
        <TrashModal onClose={onCloseTrashModal} onChanged={onTrashChanged} />
      )}
      {tileImageModal && (
        <TileImageModal
          tileWidth={tileImageModal.tileWidth}
          tileHeight={tileImageModal.tileHeight}
          initialOriginalUrl={tileImageModal.initialOriginalUrl}
          initialOpacity={tileImageModal.initialOpacity}
          onConfirm={onTileImageConfirm}
          onCancel={onCloseTileImage}
        />
      )}
      {pendingCta && (
        <AddCtaModal
          ctaType={pendingCta.blockType.slice(4)}
          onConfirm={onConfirmCta}
          onCancel={onCancelCta}
        />
      )}
    </>
  );
}
