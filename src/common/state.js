'use strict';

const { assets } = require('./assets');

const DEFAULT_STATE = Object.freeze({
  version: 1,
  next_task_id: 1,
  next_priority: 1,
  session_count: 0,
  last_simplify_session: 0,
});

function loadState() {
  return assets.readJson('harnessState', { ...DEFAULT_STATE });
}

function saveState(data) {
  assets.writeJson('harnessState', data);
}

function extractIdNum(id) {
  const m = String(id).match(/(\d+)$/);
  return m ? parseInt(m[1], 10) : 0;
}

/**
 * plan session 结束后调用：扫描 tasks.json，同步 next_task_id 和 next_priority
 */
function syncAfterPlan() {
  const state = loadState();
  const tasks = assets.readJson('tasks', null);
  if (!tasks || !tasks.features) return state;

  const features = tasks.features;
  state.next_task_id = features.reduce((max, f) => Math.max(max, extractIdNum(f.id)), 0) + 1;
  state.next_priority = features.reduce((max, f) => Math.max(max, f.priority || 0), 0) + 1;
  saveState(state);
  return state;
}

/**
 * coding session 校验成功后调用：递增 session_count
 */
function incrementSession() {
  const state = loadState();
  state.session_count++;
  saveState(state);
  return state;
}

/**
 * simplify 完成后调用：记录 last_simplify_session
 */
function markSimplifyDone() {
  const state = loadState();
  state.last_simplify_session = state.session_count;
  saveState(state);
}

/**
 * 判断自上次 simplify 以来是否有新 session
 */
function needsFinalSimplify() {
  const state = loadState();
  return state.last_simplify_session < state.session_count;
}

module.exports = {
  loadState,
  saveState,
  syncAfterPlan,
  incrementSession,
  markSimplifyDone,
  needsFinalSimplify,
  extractIdNum,
};
