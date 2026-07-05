/**
 * 模块12: 系统信息采集
 *
 * 采集 Host 系统指标（CPU / 内存 / 运行时间）。
 * 纯函数，无副作用，无状态。
 */

const os = require('os');

/**
 * 采集系统信息
 * @returns {{ hostname: string, platform: string, cpus: number, cpuModel: string, avgCpuUsage: number, totalMem: number, freeMem: number, usedMemPercent: number, uptime: number, userInfo: object }}
 */
function getSystemInfo() {
  const cpus = os.cpus();
  const totalMem = os.totalmem();
  const freeMem = os.freemem();

  const avgCpuUsage = Math.round(
    cpus.reduce((sum, c) => {
      const total = Object.values(c.times).reduce((a, b) => a + b, 0);
      return sum + (1 - (c.times.idle || 0) / total);
    }, 0) / cpus.length * 100
  );

  return {
    hostname: os.hostname(),
    platform: os.platform(),
    cpus: cpus.length,
    cpuModel: cpus[0]?.model || '',
    avgCpuUsage,
    totalMem: Math.round(totalMem / 1024 / 1024),
    freeMem: Math.round(freeMem / 1024 / 1024),
    usedMemPercent: Math.round((1 - freeMem / totalMem) * 100),
    uptime: os.uptime(),
    userInfo: os.userInfo(),
  };
}

module.exports = { getSystemInfo };
