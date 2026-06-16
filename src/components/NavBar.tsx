import { useEffect, useState } from "react";
import "./NavBar.css";
import type { AppVersion, Theme } from "../types";
import type { AnalysisIssue } from "../utils/analysisUtils";
import { AppVersionDropDown } from "./appversion/AppVersionDropDown";
import { dataStore } from "../data/datastore";
import { i18n } from "../i18n/i18n";

interface NavBarProps {
  version?: Pick<AppVersion, "AppVersionName" | "IsPublishedTemplate">;
  appVersions?: AppVersion[];
  selectedVersionId?: string;
  onVersionSelect?: (id: string) => void;
  onNewVersion?: () => void;
  onNewTemplate?: () => void;
  onDuplicateVersion?: (id: string) => void;
  onRenameVersion?: (id: string) => void;
  onUpdateTranslations?: (id: string) => void;
  onUpdateDescription?: (id: string) => void;
  onMoveVersionToTrash?: (id: string) => void;
  onCategoryChange?: (versionId: string, categoryId: string) => void;
  themes?: Theme[];
  selectedThemeId?: string;
  onThemeChange?: (id: string) => void;
  onPublish?: () => void;
  onPublishAsTemplate?: () => void;
  onUnpublishTemplate?: () => void;
  canUndo?: boolean;
  canRedo?: boolean;
  onUndo?: () => void;
  onRedo?: () => void;
  onExpand?: () => void;
  isTreeOpen?: boolean;
  isTranslationOpen?: boolean;
  onTranslationToggle?: () => void;
  canTranslate?: boolean;
  isSaving?: boolean;
  saveError?: boolean;
  savedAt?: number | null;
  analysisIssues?: AnalysisIssue[];
  analysisIssueCount?: number;
  isAnalyzing?: boolean;
  onAnalysisOpen?: () => void;
  onAnalysisRerun?: () => void;
  analysisOpen?: boolean;
  analysisCurrentIndex?: number;
  onAnalysisPrev?: () => void;
  onAnalysisNext?: () => void;
  onAnalysisClose?: () => void;
  isHistoryOpen?: boolean;
  onHistoryToggle?: () => void;
  onShareClick?: () => void;
  onTrashClick?: () => void;
  isMultiSelectMode?: boolean;
  onMultiSelectToggle?: () => void;
  showNavPaths?: boolean;
  onToggleNavPaths?: () => void;
}

// ── Inline SVG icons ─────────────────────────────────────────────────────────

function ShareIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 20 21"
    >
      <path
        id="share"
        d="M15.674.034A4.075,4.075,0,0,0,14.457.4,3.6,3.6,0,0,0,12.721,2.05a3.485,3.485,0,0,0-.276,2.555.585.585,0,0,1,.039.258c-.015.013-1.318.74-2.894,1.617L6.724,8.074l-.2-.185A3.979,3.979,0,0,0,4.5,6.912a4.952,4.952,0,0,0-1.564.049A3.893,3.893,0,0,0,.442,8.826a3.58,3.58,0,0,0,1.476,4.868,4.011,4.011,0,0,0,4.559-.5l.247-.22,2.866,1.59c1.576.874,2.878,1.6,2.894,1.615a.589.589,0,0,1-.039.259,3.556,3.556,0,0,0,.807,3.329,3.9,3.9,0,0,0,2.131,1.2,6,6,0,0,0,1.775-.045,3.9,3.9,0,0,0,1.908-1.147A3.545,3.545,0,0,0,20,17.219a3.636,3.636,0,0,0-2.087-3.1,3.843,3.843,0,0,0-2.157-.386,3.954,3.954,0,0,0-2.24.982,1.408,1.408,0,0,1-.23.193c-.017,0-5.7-3.142-5.777-3.2a1.657,1.657,0,0,1,.058-.26,3.619,3.619,0,0,0,0-1.852c-.05-.186-.056-.246-.025-.274s5.636-3.153,5.712-3.18c.028-.011.132.062.257.175a3.323,3.323,0,0,0,.891.605,3.939,3.939,0,0,0,3.231.127A3.66,3.66,0,0,0,20,3.52,3.7,3.7,0,0,0,17.341.181,4.6,4.6,0,0,0,15.674.034m1.1,1.512a2.4,2.4,0,0,1,1.452,1.141,1.877,1.877,0,0,1,.229.986,1.9,1.9,0,0,1-.236,1,2.686,2.686,0,0,1-1.01.963,2.4,2.4,0,0,1-1.779.124,2.263,2.263,0,0,1-1.335-1.127,2.472,2.472,0,0,1-.186-.461,3.617,3.617,0,0,1,0-1,2.389,2.389,0,0,1,.532-.956,2.3,2.3,0,0,1,1.484-.736,3.691,3.691,0,0,1,.849.065M4.287,8.363A2.3,2.3,0,0,1,6.068,9.932a2.55,2.55,0,0,1,0,1.181,2.3,2.3,0,0,1-1.533,1.513,2.038,2.038,0,0,1-.717.072,1.705,1.705,0,0,1-.711-.085,2.177,2.177,0,0,1-.89-.549,2.115,2.115,0,0,1-.6-.969,2.828,2.828,0,0,1,0-1.144,2.313,2.313,0,0,1,1.72-1.575,3.146,3.146,0,0,1,.952-.013m12.471,6.885a2.026,2.026,0,0,1,1.018.582,1.881,1.881,0,0,1,.678,1.543,1.877,1.877,0,0,1-.229.986,2.55,2.55,0,0,1-1.014.984,2.207,2.207,0,0,1-1.054.223,2.089,2.089,0,0,1-1.622-.651,1.7,1.7,0,0,1-.439-.575,1.733,1.733,0,0,1-.223-.966A1.7,1.7,0,0,1,14.1,16.4a1.768,1.768,0,0,1,.44-.573,2.211,2.211,0,0,1,1.784-.644,3.185,3.185,0,0,1,.433.062"
        transform="translate(-0.005 -0.012)"
        fill="#7c8791"
        fill-rule="evenodd"
      ></path>
    </svg>
  );
}

function FrameIcon() {
  return (
    <svg
      id="copySelectButton"
      xmlns="http://www.w3.org/2000/svg"
      width="31"
      height="24"
      viewBox="0 0 21 23"
    >
      <path
        id="selection"
        d="M2.516.052a3.074,3.074,0,0,0-2.5,2.8.936.936,0,0,0,.245.83.911.911,0,0,0,.957.257.955.955,0,0,0,.654-.917A1.172,1.172,0,0,1,3.021,1.869a1.024,1.024,0,0,0,.756-.352A.916.916,0,0,0,3.5.125,1.526,1.526,0,0,0,2.516.052m4.51,0a.954.954,0,0,0-.623.7.95.95,0,0,0,.335.907c.238.182.363.2,1.179.189.747-.012.747-.012.913-.11a1.141,1.141,0,0,0,.287-.263A.92.92,0,0,0,8.773.094c-.134-.071-.2-.078-.879-.086a3.352,3.352,0,0,0-.868.04m5.32,0a.983.983,0,0,0-.6.605.942.942,0,0,0,.43,1.086c.167.1.167.1.913.11a3.169,3.169,0,0,0,.9-.043.929.929,0,0,0,.365-1.52C14.1.036,14.031.018,13.214.008a3.358,3.358,0,0,0-.868.04m5.327,0a.922.922,0,0,0-.607,1.182.958.958,0,0,0,.911.638,1.172,1.172,0,0,1,1.157,1.154.958.958,0,0,0,.655.921.911.911,0,0,0,.957-.257.936.936,0,0,0,.245-.83,3.059,3.059,0,0,0-2.533-2.8,1.645,1.645,0,0,0-.785,0M.747,6.409a.9.9,0,0,0-.667.548C0,7.133,0,7.162.006,7.884c.013.827.03.9.264,1.136a.926.926,0,0,0,1.47-.188c.1-.167.1-.167.11-.912.013-.866-.013-1-.245-1.235a.942.942,0,0,0-.858-.277m19.147,0a.869.869,0,0,0-.5.282c-.225.232-.252.369-.239,1.23.012.745.012.745.11.912a.926.926,0,0,0,1.47.188c.234-.234.251-.308.264-1.136.01-.722.007-.751-.073-.927a.922.922,0,0,0-1.029-.548M.692,11.741a.953.953,0,0,0-.651.614A4.444,4.444,0,0,0,0,13.178c0,.664.005.714.083.88a.911.911,0,0,0,.844.557A.929.929,0,0,0,1.8,14a7.581,7.581,0,0,0,.015-1.653.956.956,0,0,0-1.126-.609m19.186-.016a.978.978,0,0,0-.682.589A6.852,6.852,0,0,0,19.2,14a.929.929,0,0,0,.876.612.911.911,0,0,0,.848-.566c.081-.177.083-.205.073-.927-.01-.653-.019-.763-.079-.882a.978.978,0,0,0-1.039-.515M.711,17.046a1.119,1.119,0,0,0-.516.335,1,1,0,0,0-.185.768,3.066,3.066,0,0,0,2.845,2.845.936.936,0,0,0,.829-.245.911.911,0,0,0,.257-.957.93.93,0,0,0-.884-.645,1.2,1.2,0,0,1-1.19-1.164.941.941,0,0,0-.521-.86,1.143,1.143,0,0,0-.636-.078m19.128,0a1,1,0,0,0-.617.513,2.261,2.261,0,0,0-.088.427,1.2,1.2,0,0,1-1.19,1.158.93.93,0,0,0-.884.645.911.911,0,0,0,.257.957.936.936,0,0,0,.829.245A3.081,3.081,0,0,0,20.683,19.3a2.754,2.754,0,0,0,.273-1.636.96.96,0,0,0-1.118-.615M7.012,19.2a.939.939,0,0,0-.622.882.911.911,0,0,0,.566.848c.177.081.205.083.927.073.827-.013.9-.03,1.136-.264a.837.837,0,0,0,.273-.657.811.811,0,0,0-.286-.671c-.236-.23-.365-.257-1.18-.254a4.508,4.508,0,0,0-.814.044m5.283.012a1.128,1.128,0,0,0-.517.485,1.03,1.03,0,0,0,.011.777,1.1,1.1,0,0,0,.449.45c.119.06.229.069.882.079.722.01.751.007.927-.073A.926.926,0,0,0,13.99,19.2a7.352,7.352,0,0,0-1.7.012"
        transform="translate(0 -0.003)"
        fill="#7c8791"
        fill-rule="evenodd"
      ></path>
    </svg>
  );
}

function UndoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="21"
      height="21"
      viewBox="0 0 21 21"
    >
      <path
        id="Group_4630-converted"
        data-name="Group 4630-converted"
        d="M1.046.033a1.038,1.038,0,0,0-.636.6C.38.738.369,1.545.369,3.629V6.481l.092.185a.9.9,0,0,0,.468.443A15.23,15.23,0,0,0,4,7.166c3.276-.011,3.009.012,3.293-.281A.936.936,0,0,0,6.99,5.4,6.933,6.933,0,0,0,5.21,5.317L3.575,5.3l.619-.608A8.83,8.83,0,0,1,6.811,2.815,8.95,8.95,0,0,1,10.9,1.882a8.081,8.081,0,0,1,3.731.845A8.763,8.763,0,0,1,18.2,5.918a8.994,8.994,0,0,1,1.13,2.773,9.35,9.35,0,0,1,0,3.64,8.7,8.7,0,0,1-3.667,5.377,10.6,10.6,0,0,1-1.852.939,8.735,8.735,0,0,1-4.9.287A8.63,8.63,0,0,1,5.651,17.4a11.708,11.708,0,0,1-1.664-1.664A8.6,8.6,0,0,1,2.8,13.528a.844.844,0,0,0-.673-.283.877.877,0,0,0-.836.507,1.006,1.006,0,0,0-.092.578c0,1.02,1.06,2.42,2.251,3.606A9.815,9.815,0,0,0,6.2,19.916a9.98,9.98,0,0,0,2.641.907A8.655,8.655,0,0,0,10.933,21a8.833,8.833,0,0,0,2.39-.269,10.52,10.52,0,0,0,7.8-7.847,8.76,8.76,0,0,0,.249-2.373,7.88,7.88,0,0,0-.081-1.481A10.247,10.247,0,0,0,20.3,5.871,10.488,10.488,0,0,0,12.9.2,8.922,8.922,0,0,0,10.844.021,10.8,10.8,0,0,0,6.053,1.107,10.807,10.807,0,0,0,2.859,3.385l-.632.622-.01-1.673C2.207.693,2.206.657,2.129.515A.985.985,0,0,0,1.046.033"
        transform="translate(-0.369 -0.001)"
        fill="#7c8791"
        fill-rule="evenodd"
      ></path>
    </svg>
  );
}

function RedoIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="21"
      viewBox="0 0 21 21"
    >
      <path
        id="Group_4630-converted"
        data-name="Group 4630-converted"
        d="M20.692.033a1.038,1.038,0,0,1,.636.6c.031.1.042.909.042,2.993V6.481l-.092.185a.9.9,0,0,1-.468.443,15.23,15.23,0,0,1-3.07.056c-3.276-.011-3.009.012-3.293-.281a.936.936,0,0,1,.3-1.484,6.933,6.933,0,0,1,1.779-.083L18.163,5.3l-.619-.608a8.83,8.83,0,0,0-2.617-1.877,8.95,8.95,0,0,0-4.087-.933,8.081,8.081,0,0,0-3.731.845,8.763,8.763,0,0,0-3.575,3.19A8.994,8.994,0,0,0,2.4,8.69a9.35,9.35,0,0,0,0,3.64,8.7,8.7,0,0,0,3.667,5.377,10.6,10.6,0,0,0,1.852.939,8.735,8.735,0,0,0,4.9.287A8.63,8.63,0,0,0,16.087,17.4a11.708,11.708,0,0,0,1.664-1.664,8.6,8.6,0,0,0,1.185-2.211.844.844,0,0,1,.673-.283.877.877,0,0,1,.836.507,1.006,1.006,0,0,1,.092.578c0,1.02-1.06,2.42-2.251,3.606a9.815,9.815,0,0,1-2.751,1.98,9.98,9.98,0,0,1-2.641.907A8.655,8.655,0,0,1,10.8,21a8.833,8.833,0,0,1-2.39-.269,10.52,10.52,0,0,1-7.8-7.847,8.76,8.76,0,0,1-.249-2.373A7.879,7.879,0,0,1,.45,9.03a10.247,10.247,0,0,1,.985-3.159A10.488,10.488,0,0,1,8.842.2,8.922,8.922,0,0,1,10.894.021a10.8,10.8,0,0,1,4.791,1.086,10.807,10.807,0,0,1,3.193,2.278l.632.622.01-1.673c.011-1.641.012-1.677.088-1.819A.985.985,0,0,1,20.692.033"
        transform="translate(-0.369 -0.001)"
        fill="#7c8791"
        fill-rule="evenodd"
      ></path>
    </svg>
  );
}

function HistoryIcon({ active }: { active?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="21"
      height="21"
      viewBox="0 0 21 21"
    >
      <path
        id="Group_4626-converted"
        data-name="Group 4626-converted"
        d="M1.046.033a1.038,1.038,0,0,0-.636.6C.38.738.369,1.545.369,3.629V6.481l.092.185a.9.9,0,0,0,.468.443A15.23,15.23,0,0,0,4,7.166c3.276-.011,3.009.012,3.293-.281A.936.936,0,0,0,6.99,5.4,6.933,6.933,0,0,0,5.21,5.317L3.575,5.3l.619-.608A8.83,8.83,0,0,1,6.811,2.815,8.95,8.95,0,0,1,10.9,1.882a8.081,8.081,0,0,1,3.731.845A8.763,8.763,0,0,1,18.2,5.918a8.994,8.994,0,0,1,1.13,2.773,9.35,9.35,0,0,1,0,3.64,8.7,8.7,0,0,1-3.667,5.377,10.6,10.6,0,0,1-1.852.939,8.735,8.735,0,0,1-4.9.287A8.63,8.63,0,0,1,5.651,17.4a11.708,11.708,0,0,1-1.664-1.664,8.568,8.568,0,0,1-1.746-4.871c-.027-.6-.078-.784-.272-.983A.844.844,0,0,0,1.3,9.6a.877.877,0,0,0-.836.507,1.006,1.006,0,0,0-.092.578,10.1,10.1,0,0,0,.55,3.186,10.129,10.129,0,0,0,2.533,4.063A9.815,9.815,0,0,0,6.2,19.916a9.98,9.98,0,0,0,2.641.907A8.655,8.655,0,0,0,10.933,21a8.833,8.833,0,0,0,2.39-.269,10.52,10.52,0,0,0,7.8-7.847,8.76,8.76,0,0,0,.249-2.373,7.88,7.88,0,0,0-.081-1.481A10.247,10.247,0,0,0,20.3,5.871,10.488,10.488,0,0,0,12.9.2,8.922,8.922,0,0,0,10.844.021,10.8,10.8,0,0,0,6.053,1.107,10.807,10.807,0,0,0,2.859,3.385l-.632.622-.01-1.673C2.207.693,2.206.657,2.129.515A.985.985,0,0,0,1.046.033m9.649,4.252a.92.92,0,0,0-.669.533c-.073.159-.075.208-.084,2.959-.012,3.177-.021,3.056.259,3.353a13.129,13.129,0,0,0,2.4,1.288c2.132,1.064,2.262,1.123,2.478,1.137a.745.745,0,0,0,.413-.066.984.984,0,0,0,.523-.581.756.756,0,0,0-.005-.555c-.122-.379-.117-.375-2.244-1.441L11.828,9.94l-.01-2.481c-.011-2.432-.012-2.484-.085-2.642a.96.96,0,0,0-1.038-.533"
        transform="translate(-0.369 -0.001)"
        fill={active ? "#2563eb" : "#7c8791"}
        fill-rule="evenodd"
      ></path>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="19"
      height="21"
      viewBox="0 0 19 21"
    >
      <path
        id="Group_4626-converted_3_"
        data-name="Group 4626-converted (3)"
        d="M7.105.047A2.783,2.783,0,0,0,4.946,1.931a3.546,3.546,0,0,0-.132,1.276v.676H2.738c-2.033,0-2.079,0-2.224.066a.824.824,0,0,0-.506.719.588.588,0,0,0,.063.367.892.892,0,0,0,.436.455c.127.059.214.068.784.077l.642.01v6.493c0,7.146-.013,6.689.192,7.223a3.066,3.066,0,0,0,.967,1.24,3.058,3.058,0,0,0,.853.4l.274.08H14.783l.27-.079a2.6,2.6,0,0,0,1.209-.714,2.726,2.726,0,0,0,.757-1.41c.045-.22.05-.93.05-6.738V5.575l.642-.01c.571-.01.657-.018.784-.077a.892.892,0,0,0,.436-.455.829.829,0,0,0-.444-1.086c-.145-.065-.191-.066-2.222-.066H14.194l-.013-.8a2.83,2.83,0,0,0-.1-1.073A2.744,2.744,0,0,0,13.414.864a2.813,2.813,0,0,0-1.3-.775A11.017,11.017,0,0,0,9.6.011c-1.765,0-2.315,0-2.491.036m4.776,1.76a1.086,1.086,0,0,1,.528.545c.08.172.084.2.1.855l.012.677H6.486L6.5,3.207c.012-.651.015-.683.1-.855a1.1,1.1,0,0,1,.78-.632C7.455,1.705,8.455,1.7,9.6,1.7l2.075,0,.21.1m3.5,10.25-.009,6.486L15.3,18.7a1.1,1.1,0,0,1-.722.606c-.272.072-9.88.072-10.152,0A1.1,1.1,0,0,1,3.7,18.7l-.077-.158-.009-6.486L3.61,5.571H15.392l-.008,6.486M7.233,8.783a1.051,1.051,0,0,0-.416.394A19.689,19.689,0,0,0,6.753,12.4c-.011,3.479-.023,3.267.209,3.525a.829.829,0,0,0,1.352-.169l.094-.172.009-3.054c.01-3.413.018-3.274-.208-3.526a.887.887,0,0,0-.976-.22m3.835.015A1.019,1.019,0,0,0,10.793,9c-.226.251-.217.113-.208,3.526l.009,3.054.093.169a.827.827,0,0,0,1.353.172c.232-.258.219-.046.209-3.525a19.689,19.689,0,0,0-.064-3.222,1.051,1.051,0,0,0-.416-.394.935.935,0,0,0-.7.015"
        transform="translate(-0.001 -0.01)"
        fill="#7c8791"
        fill-rule="evenodd"
      ></path>
    </svg>
  );
}

function GlobeIcon({ active }: { active?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="21"
      height="21"
      viewBox="0 0 21 21"
    >
      <path
        id="translate_icon"
        d="M9.732.343C9.674.351,9.461.374,9.258.4a10.052,10.052,0,0,0-3.278.958A10.434,10.434,0,0,0,.515,7.6a9.212,9.212,0,0,0-.494,3.277A8.065,8.065,0,0,0,.1,12.32a10.564,10.564,0,0,0,8.614,8.9,7.856,7.856,0,0,0,1.62.107,8.32,8.32,0,0,0,1.648-.058,10.547,10.547,0,0,0,8.958-8.947,8.066,8.066,0,0,0,.08-1.439,8.842,8.842,0,0,0-.3-2.6A10.553,10.553,0,0,0,15.956,1.83,10.7,10.7,0,0,0,11.929.407a20.39,20.39,0,0,0-2.2-.065M8.5,2.371a14.959,14.959,0,0,0-2.6,7.415l-.024.324H1.509v-.092A9.47,9.47,0,0,1,1.864,8.2,9.074,9.074,0,0,1,8.522,2l.273-.065s-.125.193-.29.432m4.559-.225A9.083,9.083,0,0,1,19.178,8.2a9.681,9.681,0,0,1,.355,1.852c0,.06-.115.063-2.188.063H15.158l-.024-.324a14.966,14.966,0,0,0-2.6-7.416l-.292-.425.269.061c.148.033.4.1.55.14m-2.285.32a13.525,13.525,0,0,1,2.489,5,13.6,13.6,0,0,1,.393,2.376l.023.272H7.359l.023-.272a13.475,13.475,0,0,1,2.882-7.372,1.715,1.715,0,0,1,.257-.284,1.715,1.715,0,0,1,.257.284m-4.87,9.441a14.976,14.976,0,0,0,2.576,7.372,2.988,2.988,0,0,1,.269.434,3.292,3.292,0,0,1-.8-.187,9.072,9.072,0,0,1-2.9-1.464,11.451,11.451,0,0,1-1.531-1.48,9.084,9.084,0,0,1-2-4.762L1.5,11.583H5.884l.024.324m7.753-.07A13.534,13.534,0,0,1,12.6,16.167a13.889,13.889,0,0,1-1.989,3.257l-.09.1-.09-.1a15.1,15.1,0,0,1-.917-1.253,13.419,13.419,0,0,1-1.989-5.149c-.072-.448-.16-1.212-.16-1.394a30.734,30.734,0,0,1,3.16-.044h3.159l-.023.255M19.52,11.8a9.079,9.079,0,0,1-1.768,4.482,12.022,12.022,0,0,1-1.763,1.779,9.14,9.14,0,0,1-2.9,1.463,3.292,3.292,0,0,1-.8.187,2.988,2.988,0,0,1,.269-.434,15.033,15.033,0,0,0,2.576-7.372l.024-.324h4.384l-.023.219"
        transform="translate(-0.021 -0.332)"
        fill={active ? "#2563eb" : "#7c8791"}
        fillRule="evenodd"
      ></path>
    </svg>
  );
}

function PathIcon({ active }: { active?: boolean }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="21"
      height="21"
      viewBox="0 0 25 20"
    >
      <path
        id="сonnection_"
        data-name="сonnection "
        d="M21.962.03A4.56,4.56,0,0,0,20.927.24a3.9,3.9,0,0,0-2.364,2.382l-.077.222-.868.014a6.244,6.244,0,0,0-1.312.108,5.214,5.214,0,0,0-2.657,1.387,2.273,2.273,0,0,0-.57.788A6.133,6.133,0,0,0,12.527,8.1c-.014.641.006,1.689.047,2.671.12,2.785.073,3.677-.237,4.5a3.3,3.3,0,0,1-2.1,1.535,12.646,12.646,0,0,1-2.156.171H7.7l-.03-.226a3.881,3.881,0,0,0-2.263-3,3.06,3.06,0,0,0-1.542-.288,3.058,3.058,0,0,0-1.021.1A3.861,3.861,0,0,0,.108,16.445a4.535,4.535,0,0,0,0,1.582,3.822,3.822,0,0,0,2.935,2.927,5.276,5.276,0,0,0,1.624,0A3.867,3.867,0,0,0,7.433,18.64c.07-.17.129-.255.19-.267s.558-.027,1.131-.037a6.364,6.364,0,0,0,2.2-.287,4.872,4.872,0,0,0,1.972-1.223,2.314,2.314,0,0,0,.6-.8A5.49,5.49,0,0,0,14,14.242c.054-.514.031-2.814-.048-4.787A15.279,15.279,0,0,1,14.036,6.7a3.276,3.276,0,0,1,.4-1.108A3.746,3.746,0,0,1,16.366,4.4,5.9,5.9,0,0,1,18,4.245c.366.028.381.034.4.144a3.923,3.923,0,0,0,1.133,2.17,3.982,3.982,0,0,0,1.654.948,3.056,3.056,0,0,0,1.012.1,3.072,3.072,0,0,0,1.02-.1,3.9,3.9,0,0,0,2.547-2.253A3.831,3.831,0,0,0,24.644.89,3.947,3.947,0,0,0,21.962.03m.873,1.48a2.2,2.2,0,0,1,1.08.626,2.171,2.171,0,0,1,.631,1.071A2.421,2.421,0,0,1,21.158,6a2.743,2.743,0,0,1-1.125-1.092,2.421,2.421,0,0,1,2.8-3.4M4.3,14.867a2.575,2.575,0,0,1,1.737,1.29,2.418,2.418,0,0,1-2.171,3.485,2.788,2.788,0,0,1-1.21-.312,3.111,3.111,0,0,1-.9-.9,2.728,2.728,0,0,1-.315-1.2A2.452,2.452,0,0,1,3.8,14.823a3.322,3.322,0,0,1,.5.044"
        transform="translate(-0.038 -0.019)"
        fill={active ? "#2563eb" : "#7c8791"}
        fill-rule="evenodd"
      ></path>
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="21"
      height="21"
      viewBox="0 0 20 20"
    >
      <g id="window-maximize" transform="translate(-3.25 -3.25)">
        <path
          id="Path_989"
          data-name="Path 989"
          d="M20.107,23.25H13.25a.857.857,0,1,1,0-1.714h6.857a1.429,1.429,0,0,0,1.429-1.429V6.393a1.429,1.429,0,0,0-1.429-1.429H6.393A1.429,1.429,0,0,0,4.964,6.393V13.25a.857.857,0,0,1-1.714,0V6.393A3.143,3.143,0,0,1,6.393,3.25H20.107A3.143,3.143,0,0,1,23.25,6.393V20.107a3.143,3.143,0,0,1-3.143,3.143Z"
          fill="#7c8791"
        ></path>
        <path
          id="Path_990"
          data-name="Path 990"
          d="M16.159,12.934a.785.785,0,0,1-.775-.775V8.8H12.025a.775.775,0,1,1,0-1.55h4.133a.785.785,0,0,1,.775.775v4.133A.785.785,0,0,1,16.159,12.934Z"
          transform="translate(1.544 0.772)"
          fill="#7c8791"
        ></path>
        <path
          id="Path_991"
          data-name="Path 991"
          d="M11.523,13.449a.765.765,0,0,1-.517-.258.775.775,0,0,1,0-1.033l4.65-4.65a.775.775,0,0,1,1.1,1.1L12.04,13.19A.765.765,0,0,1,11.523,13.449Z"
          transform="translate(1.506 0.807)"
          fill="#7c8791"
        ></path>
        <path
          id="Path_992"
          data-name="Path 992"
          d="M8.159,20.967h-3.1A1.819,1.819,0,0,1,3.25,19.159v-3.1A1.819,1.819,0,0,1,5.058,14.25h3.1a1.819,1.819,0,0,1,1.808,1.808v3.1A1.819,1.819,0,0,1,8.159,20.967ZM5.058,15.8a.258.258,0,0,0-.258.258v3.1a.258.258,0,0,0,.258.258h3.1a.258.258,0,0,0,.258-.258v-3.1a.258.258,0,0,0-.258-.258Z"
          transform="translate(0 2.283)"
          fill="#7c8791"
        ></path>
      </g>
    </svg>
  );
}

function CloudIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="22"
      height="15"
      viewBox="0 0 22 15"
      fill="none"
    >
      <path
        d="M17.2 5.9C17.1 3.3 14.9 1.2 12.3 1.2C10.2 1.2 8.4 2.5 7.6 4.4C7.2 4.2 6.7 4.1 6.2 4.1C4.2 4.1 2.6 5.7 2.6 7.8C2.6 9.9 4.2 11.5 6.2 11.5H17.3C19.1 11.5 20.6 10 20.6 8.2C20.6 6.5 19.2 5.1 17.5 5.1C17.4 5.4 17.3 5.6 17.2 5.9Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function AnalysisIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 21 21"
      aria-hidden="true"
    >
      <path
        d="M8.786.02a9.494,9.494,0,0,0-5.194,2A12.252,12.252,0,0,0,1.912,3.739a9.426,9.426,0,0,0-.989,9.768,9.243,9.243,0,0,0,1.85,2.582,8.991,8.991,0,0,0,3.369,2.18,9.4,9.4,0,0,0,8.934-1.292l.415-.313,2.135,2.128c2.3,2.294,2.217,2.223,2.6,2.219A.8.8,0,0,0,21,20.234c0-.381.074-.3-2.218-2.6L16.654,15.5l.312-.415A9.442,9.442,0,0,0,16.94,3.739,12.292,12.292,0,0,0,15.26,2.022,9.488,9.488,0,0,0,10.689.085,16.037,16.037,0,0,0,8.786.02M10.8,1.738a7.507,7.507,0,0,1,1.3.35,7.806,7.806,0,0,1,5.02,5.973,9.789,9.789,0,0,1,.048,2.389,7.775,7.775,0,0,1-4.3,5.993,7.3,7.3,0,0,1-3.432.791,7.354,7.354,0,0,1-3.361-.755,7.824,7.824,0,0,1-4.178-5.023,5.959,5.959,0,0,1-.232-2.025,6,6,0,0,1,.217-1.976A7.841,7.841,0,0,1,7.847,1.781a6.249,6.249,0,0,1,1.7-.129,6.4,6.4,0,0,1,1.245.086m2.615,4.8c-.079.033-.743.672-1.787,1.715L9.959,9.911l-.845-.842a12.438,12.438,0,0,0-.97-.905.892.892,0,0,0-.694.013c-.084.044-.74.676-1.6,1.546C4.307,11.273,4.3,11.278,4.3,11.592a.862.862,0,0,0,.48.725.938.938,0,0,0,.651.012,12.252,12.252,0,0,0,1.253-1.174l1.12-1.119.818.821c.867.872,1.027.992,1.316.993.361,0,.279.071,2.445-2.093,1.154-1.152,2.044-2.07,2.077-2.14a.817.817,0,0,0-.422-1.087.984.984,0,0,0-.632,0"
        transform="translate(0.001 -0.011)"
        fill="currentColor"
        fillRule="evenodd"
      />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M7 10V3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <path
        d="M4 6L7 3L10 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M2 11H12"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

// ── Component ─────────────────────────────────────────────────────────────────

export function NavBar({
  version,
  appVersions,
  selectedVersionId,
  onVersionSelect,
  onNewVersion,
  onNewTemplate,
  onDuplicateVersion,
  onRenameVersion,
  onUpdateTranslations,
  onUpdateDescription,
  onMoveVersionToTrash,
  onCategoryChange,
  themes = [],
  selectedThemeId = "",
  onThemeChange,
  onPublish,
  onPublishAsTemplate,
  onUnpublishTemplate,
  canUndo = false,
  canRedo = false,
  onUndo,
  onRedo,
  onExpand,
  isTreeOpen = false,
  isTranslationOpen = false,
  onTranslationToggle,
  canTranslate = false,
  isSaving = false,
  saveError = false,
  savedAt = null,
  analysisIssues: _analysisIssues = [] as AnalysisIssue[],
  analysisIssueCount = 0,
  isAnalyzing = false,
  onAnalysisOpen,
  onAnalysisRerun: _onAnalysisRerun,
  analysisOpen = false,
  analysisCurrentIndex = 0,
  onAnalysisPrev,
  onAnalysisNext,
  onAnalysisClose,
  isHistoryOpen = false,
  onHistoryToggle,
  onShareClick,
  onTrashClick,
  isMultiSelectMode = false,
  onMultiSelectToggle,
  showNavPaths = false,
  onToggleNavPaths,
}: NavBarProps) {
  const userRoles: string[] = dataStore.get("UserRoles") ?? [];
  const isComfortaAdmin = userRoles.includes("Comforta Admin");

  const safeIndex = Math.min(
    analysisCurrentIndex,
    Math.max(0, analysisIssueCount - 1),
  );
  const [savedVisible, setSavedVisible] = useState(false);
  useEffect(() => {
    if (!savedAt) return;
    setSavedVisible(true);
    const t = setTimeout(() => setSavedVisible(false), 2000);
    return () => clearTimeout(t);
  }, [savedAt]);

  const locked =
    isTranslationOpen ||
    analysisOpen ||
    isMultiSelectMode ||
    isHistoryOpen ||
    isTreeOpen;

  return (
    <nav className="navbar" aria-label="App builder toolbar">
      {/* Left: version selector + version-level actions */}
      <div className="navbar-left">
        <AppVersionDropDown
          versionName={version?.AppVersionName}
          appVersions={appVersions}
          selectedVersionId={selectedVersionId}
          onVersionSelect={onVersionSelect}
          onNewVersion={onNewVersion}
          onNewTemplate={onNewTemplate}
          onDuplicate={onDuplicateVersion}
          onRename={onRenameVersion}
          onUpdateTranslations={onUpdateTranslations}
          onUpdateDescription={onUpdateDescription}
          onMoveToTrash={onMoveVersionToTrash}
          onCategoryChange={onCategoryChange}
          disabled={locked}
        />
        <button
          className={`navbar-icon-btn${analysisOpen ? " navbar-icon-btn--active" : ""}`}
          type="button"
          title={
            analysisOpen
              ? i18n.t("navbar.analyse.close")
              : isAnalyzing
                ? i18n.t("navbar.analyse.analysing")
                : analysisIssueCount > 0
                  ? i18n.t("navbar.analyse.issues_found", { count: analysisIssueCount })
                  : i18n.t("navbar.analyse.label")
          }
          onClick={analysisOpen ? onAnalysisClose : onAnalysisOpen}
          disabled={locked && !analysisOpen}
        >
          <AnalysisIcon />
          {isAnalyzing && analysisIssueCount === 0 ? (
            <span className="navbar-analysis-badge navbar-analysis-badge--checking">
              …
            </span>
          ) : analysisIssueCount > 0 ? (
            <span className="navbar-analysis-badge">
              {analysisIssueCount > 99 ? "99+" : analysisIssueCount}
            </span>
          ) : null}
        </button>
        <button
          className="navbar-icon-btn"
          type="button"
          title={i18n.t("navbar.share.label")}
          onClick={onShareClick}
          disabled={locked}
        >
          <ShareIcon />
        </button>
        <button
          className={`navbar-icon-btn${isMultiSelectMode ? " navbar-icon-btn--active" : ""}`}
          type="button"
          title={i18n.t("navbar.select_frame")}
          onClick={onMultiSelectToggle}
          disabled={locked && !isMultiSelectMode}
        >
          <FrameIcon />
        </button>
        {(isSaving || saveError || savedVisible) && (
          <div
            className={`navbar-save-indicator${isSaving ? " navbar-save-indicator--saving" : saveError ? " navbar-save-indicator--error" : " navbar-save-indicator--saved"}`}
          >
            <CloudIcon />
            <span>
              {isSaving ? i18n.t("navbar.autoSave.saving") : saveError ? i18n.t("navbar.autoSave.save_failed") : i18n.t("navbar.autoSave.saved")}
            </span>
          </div>
        )}
      </div>
      {analysisOpen ? (
        <div className="navbar-center">
          <div className="navbar-analysis-bar">
            <button
              className="navbar-analysis-nav-btn"
              onClick={onAnalysisPrev}
              disabled={analysisIssueCount === 0}
              title={i18n.t("navbar.analyse.previous_issue")}
              type="button"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1.5 6.5L5 3l3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="navbar-analysis-nav-btn"
              onClick={onAnalysisNext}
              disabled={analysisIssueCount === 0}
              title={i18n.t("navbar.analyse.next_issue")}
              type="button"
            >
              <svg
                width="10"
                height="10"
                viewBox="0 0 10 10"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M1.5 3.5L5 7l3.5-3.5"
                  stroke="currentColor"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <span className="navbar-analysis-counter">
              {isAnalyzing && analysisIssueCount === 0 ? (
                <span className="navbar-analysis-spinner" />
              ) : analysisIssueCount === 0 ? (
                i18n.t("navbar.analyse.no_issues")
              ) : (
                i18n.t("navbar.analyse.issue_counter", { current: safeIndex + 1, total: analysisIssueCount })
              )}
            </span>
          </div>
        </div>
      ) : (
        <div className="navbar-spacer" />
      )}

      {/* Right: history + content actions + theme + publish */}
      <div className="navbar-right">
        <button
          className="navbar-icon-btn"
          type="button"
          title={i18n.t("undo")}
          disabled={!canUndo || locked}
          onClick={onUndo}
        >
          <UndoIcon />
        </button>
        <button
          className="navbar-icon-btn"
          type="button"
          title={i18n.t("redo")}
          disabled={!canRedo || locked}
          onClick={onRedo}
        >
          <RedoIcon />
        </button>
        <button
          className="navbar-icon-btn"
          type="button"
          title={i18n.t("version_history.versionHistory")}
          onClick={onHistoryToggle}
          disabled={locked && !isHistoryOpen}
        >
          <HistoryIcon active={isHistoryOpen} />
        </button>
        <button
          className="navbar-icon-btn"
          type="button"
          title={i18n.t("navbar.trash.label")}
          onClick={onTrashClick}
          disabled={locked}
        >
          <TrashIcon />
        </button>
        <div className="navbar-separator" role="separator" />
        {canTranslate && (
          <>
            <button
              className="navbar-icon-btn"
              type="button"
              title={i18n.t("translate")}
              onClick={onTranslationToggle}
              disabled={(locked && !isTranslationOpen) || isSaving}
            >
              <GlobeIcon active={isTranslationOpen} />
            </button>
          </>
        )}
        <button
          className={`navbar-icon-btn${showNavPaths ? " navbar-icon-btn--active" : ""}`}
          type="button"
          title={i18n.t("navbar.show_navigation")}
          onClick={onToggleNavPaths}
          disabled={locked}
        >
          <PathIcon active={showNavPaths} />
        </button>
        <button
          className={`navbar-icon-btn${isTreeOpen ? " navbar-icon-btn--active" : ""}`}
          type="button"
          title={i18n.t("link_to_tree")}
          onClick={onExpand}
          disabled={locked && !isTreeOpen}
        >
          <ExpandIcon />
        </button>
        <select
          className="navbar-theme-select"
          value={selectedThemeId}
          onChange={(e) => onThemeChange?.(e.target.value)}
          aria-label="Select theme"
          disabled={locked}
        >
          {themes.map((t) => (
            <option key={t.ThemeId} value={t.ThemeId}>
              {t.ThemeName}
            </option>
          ))}
        </select>
        {isComfortaAdmin ? (
          version?.IsPublishedTemplate ? (
            <button
              className="navbar-publish"
              type="button"
              onClick={onUnpublishTemplate}
              title={i18n.t("navbar.publish.un_publish")}
              disabled={locked}
            >
              <span style={{ display: "inline-flex", transform: "scaleY(-1)" }}>
                <UploadIcon />
              </span>
              {i18n.t("navbar.publish.un_publish")}
            </button>
          ) : (
            <button
              disabled={locked}
              className="navbar-publish"
              type="button"
              onClick={onPublishAsTemplate}
            >
              <UploadIcon />
              {i18n.t("navbar.publish.label")}
            </button>
          )
        ) : (
          <button
            disabled={locked}
            className="navbar-publish"
            type="button"
            onClick={onPublish}
          >
            <UploadIcon />
            {i18n.t("navbar.publish.label")}
          </button>
        )}
      </div>
    </nav>
  );
}
