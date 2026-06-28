// src/components/chameleon-calc/MatrixEngine.ts

export type Matrix = number[][];

export interface LUResult {
  L: Matrix;
  U: Matrix;
  steps: string[];
}

export interface QRResult {
  Q: Matrix;
  R: Matrix;
  steps: string[];
}

// Helper to create a zero matrix
export function createZeroMatrix(rows: number, cols: number): Matrix {
  return Array.from({ length: rows }, () => Array(cols).fill(0));
}

// Helper to create an identity matrix
export function createIdentityMatrix(n: number): Matrix {
  const I = createZeroMatrix(n, n);
  for (let i = 0; i < n; i++) {
    I[i][i] = 1;
  }
  return I;
}

// Transpose
export function transpose(A: Matrix): Matrix {
  const rows = A.length;
  const cols = A[0].length;
  const T = createZeroMatrix(cols, rows);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      T[c][r] = A[r][c];
    }
  }
  return T;
}

// Trace
export function trace(A: Matrix): number {
  if (A.length !== A[0].length) throw new Error("Matrix must be square");
  let sum = 0;
  for (let i = 0; i < A.length; i++) {
    sum += A[i][i];
  }
  return sum;
}

// Addition
export function add(A: Matrix, B: Matrix): Matrix {
  if (A.length !== B.length || A[0].length !== B[0].length) {
    throw new Error("Matrices must have the same dimensions for addition");
  }
  const R = createZeroMatrix(A.length, A[0].length);
  for (let r = 0; r < A.length; r++) {
    for (let c = 0; c < A[0].length; c++) {
      R[r][c] = A[r][c] + B[r][c];
    }
  }
  return R;
}

// Subtraction
export function subtract(A: Matrix, B: Matrix): Matrix {
  if (A.length !== B.length || A[0].length !== B[0].length) {
    throw new Error("Matrices must have the same dimensions for subtraction");
  }
  const R = createZeroMatrix(A.length, A[0].length);
  for (let r = 0; r < A.length; r++) {
    for (let c = 0; c < A[0].length; c++) {
      R[r][c] = A[r][c] - B[r][c];
    }
  }
  return R;
}

// Multiplication
export function multiply(A: Matrix, B: Matrix): Matrix {
  if (A[0].length !== B.length) {
    throw new Error("Inner dimensions must match for multiplication");
  }
  const rows = A.length;
  const cols = B[0].length;
  const inner = A[0].length;
  const R = createZeroMatrix(rows, cols);
  
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      let sum = 0;
      for (let i = 0; i < inner; i++) {
        sum += A[r][i] * B[i][c];
      }
      R[r][c] = sum;
    }
  }
  return R;
}

// Scalar Multiplication
export function multiplyScalar(A: Matrix, k: number): Matrix {
  const R = createZeroMatrix(A.length, A[0].length);
  for (let r = 0; r < A.length; r++) {
    for (let c = 0; c < A[0].length; c++) {
      R[r][c] = A[r][c] * k;
    }
  }
  return R;
}

// Determinant (Cofactor Expansion, suitable for n <= 4)
export function determinant(A: Matrix): number {
  const n = A.length;
  if (n !== A[0].length) throw new Error("Matrix must be square");
  
  if (n === 1) return A[0][0];
  if (n === 2) return A[0][0] * A[1][1] - A[0][1] * A[1][0];
  
  let det = 0;
  for (let j = 0; j < n; j++) {
    const sub = getSubmatrix(A, 0, j);
    const sign = j % 2 === 0 ? 1 : -1;
    det += sign * A[0][j] * determinant(sub);
  }
  return det;
}

// Helper to get minor submatrix (remove row r and col c)
function getSubmatrix(A: Matrix, rowToRemove: number, colToRemove: number): Matrix {
  const n = A.length;
  const sub = createZeroMatrix(n - 1, n - 1);
  let subRow = 0;
  for (let r = 0; r < n; r++) {
    if (r === rowToRemove) continue;
    let subCol = 0;
    for (let c = 0; c < n; c++) {
      if (c === colToRemove) continue;
      sub[subRow][subCol] = A[r][c];
      subCol++;
    }
    subRow++;
  }
  return sub;
}

// Inverse (using Gauss-Jordan Elimination)
export function inverse(A: Matrix): Matrix | null {
  const n = A.length;
  if (n !== A[0].length) throw new Error("Matrix must be square");
  
  // Clone A and create identity matrix side-by-side (augmented matrix)
  const aug: Matrix = [];
  for (let i = 0; i < n; i++) {
    aug.push([...A[i], ...createIdentityMatrix(n)[i]]);
  }
  
  const cols = 2 * n;
  
  for (let i = 0; i < n; i++) {
    // Find pivot
    let pivotRow = i;
    for (let r = i + 1; r < n; r++) {
      if (Math.abs(aug[r][i]) > Math.abs(aug[pivotRow][i])) {
        pivotRow = r;
      }
    }
    
    // Swap rows
    if (pivotRow !== i) {
      const temp = aug[i];
      aug[i] = aug[pivotRow];
      aug[pivotRow] = temp;
    }
    
    const pivot = aug[i][i];
    if (Math.abs(pivot) < 1e-10) {
      return null; // Singular matrix
    }
    
    // Normalize pivot row
    for (let c = i; c < cols; c++) {
      aug[i][c] /= pivot;
    }
    
    // Eliminate column elements in other rows
    for (let r = 0; r < n; r++) {
      if (r !== i) {
        const factor = aug[r][i];
        for (let c = i; c < cols; c++) {
          aug[r][c] -= factor * aug[i][c];
        }
      }
    }
  }
  
  // Extract inverse
  const inv = createZeroMatrix(n, n);
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      inv[r][c] = aug[r][c + n];
    }
  }
  return inv;
}

// LU Decomposition (Doolittle Algorithm: A = L * U, where L has 1s on diagonal)
export function luDecomposition(A: Matrix): LUResult {
  const n = A.length;
  if (n !== A[0].length) throw new Error("Matrix must be square for LU decomposition");
  
  const L = createIdentityMatrix(n);
  const U = createZeroMatrix(n, n);
  const steps: string[] = [];
  
  steps.push("Starting LU Decomposition using Doolittle's Algorithm (A = LU)...");
  
  for (let i = 0; i < n; i++) {
    // Upper
    for (let k = i; k < n; k++) {
      let sum = 0;
      for (let j = 0; j < i; j++) {
        sum += L[i][j] * U[j][k];
      }
      U[i][k] = A[i][k] - sum;
    }
    steps.push(`Computed Row ${i} of U: [${U[i].map(x => x.toFixed(3)).join(", ")}]`);
    
    // Lower
    for (let k = i + 1; k < n; k++) {
      let sum = 0;
      for (let j = 0; j < i; j++) {
        sum += L[k][j] * U[j][i];
      }
      if (Math.abs(U[i][i]) < 1e-10) {
        steps.push(`Warning: U[${i}][${i}] is extremely close to 0. Added small epsilon for stability.`);
        U[i][i] = 1e-9;
      }
      L[k][i] = (A[k][i] - sum) / U[i][i];
    }
    
    const Lcol = [];
    for (let row = 0; row < n; row++) Lcol.push(L[row][i].toFixed(3));
    steps.push(`Computed Column ${i} of L: [${Lcol.join(", ")}]`);
  }
  
  steps.push("LU decomposition completed successfully.");
  return { L, U, steps };
}

// QR Decomposition (Gram-Schmidt Process: A = Q * R)
export function qrDecomposition(A: Matrix): QRResult {
  const rows = A.length;
  const cols = A[0].length;
  
  const Q = createZeroMatrix(rows, cols);
  const R = createZeroMatrix(cols, cols);
  const steps: string[] = [];
  
  steps.push("Starting QR Decomposition using Classical Gram-Schmidt (A = QR)...");
  
  // Extract columns of A
  const columnsOfA: number[][] = [];
  for (let c = 0; c < cols; c++) {
    const col = [];
    for (let r = 0; r < rows; r++) {
      col.push(A[r][c]);
    }
    columnsOfA.push(col);
  }
  
  const columnsOfQ: number[][] = createZeroMatrix(cols, rows); // columnsOfQ[j][r]
  
  for (let j = 0; j < cols; j++) {
    let v = [...columnsOfA[j]]; // Copy column j
    
    steps.push(`Processing Column ${j}: a_${j} = [${v.map(x => x.toFixed(3)).join(", ")}]`);
    
    for (let i = 0; i < j; i++) {
      // Dot product: r_ij = q_i . a_j
      let r_ij = 0;
      for (let r = 0; r < rows; r++) {
        r_ij += columnsOfQ[i][r] * columnsOfA[j][r];
      }
      R[i][j] = r_ij;
      
      steps.push(`  Dot product with q_${i}: r_${i}${j} = ${r_ij.toFixed(4)}`);
      
      // Subtract projection: v = v - r_ij * q_i
      for (let r = 0; r < rows; r++) {
        v[r] -= r_ij * columnsOfQ[i][r];
      }
    }
    
    // Norm of orthogonalized vector: r_jj = ||v||
    let norm = 0;
    for (let r = 0; r < rows; r++) {
      norm += v[r] * v[r];
    }
    norm = Math.sqrt(norm);
    R[j][j] = norm;
    
    steps.push(`  Orthogonalized vector norm: r_${j}${j} = ${norm.toFixed(4)}`);
    
    // Normalize to get q_j
    if (norm > 1e-10) {
      for (let r = 0; r < rows; r++) {
        columnsOfQ[j][r] = v[r] / norm;
      }
    } else {
      steps.push(`  Warning: Column ${j} is linearly dependent. Generating orthogonal vector.`);
      // Pick a unit vector
      columnsOfQ[j][j] = 1;
    }
    
    steps.push(`  Normalized column q_${j} = [${columnsOfQ[j].map(x => x.toFixed(3)).join(", ")}]`);
  }
  
  // Transpose columns of Q to get row-by-row Q matrix
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      Q[r][c] = columnsOfQ[c][r];
    }
  }
  
  steps.push("QR decomposition completed successfully.");
  return { Q, R, steps };
}

// Eigenvalues calculation using QR Algorithm
export function computeEigenvalues(A: Matrix, maxIterations = 80): number[] {
  const n = A.length;
  if (n !== A[0].length) throw new Error("Matrix must be square to compute eigenvalues");
  
  let Ak = A;
  
  // Iterative QR transformation
  for (let iter = 0; iter < maxIterations; iter++) {
    try {
      const qr = qrDecomposition(Ak);
      Ak = multiply(qr.R, qr.Q);
    } catch {
      break;
    }
  }
  
  // Extract diagonal values
  const eigenvalues: number[] = [];
  for (let i = 0; i < n; i++) {
    eigenvalues.push(Ak[i][i]);
  }
  
  return eigenvalues;
}

export interface SVDResult {
  U: Matrix;
  S: number[];
  VT: Matrix;
  steps: string[];
}

export function jacobiEigen(B: Matrix, maxIterations = 100): { eigenvalues: number[]; eigenvectors: Matrix; steps: string[] } {
  const n = B.length;
  const V = createIdentityMatrix(n);
  const B_curr = B.map(row => [...row]);
  const steps: string[] = [];

  steps.push("Starting Jacobi Eigenvalue Algorithm for symmetric matrix A^T A...");

  for (let iter = 0; iter < maxIterations; iter++) {
    // Find largest off-diagonal element B_curr[p][q]
    let p = 0;
    let q = 1;
    let maxVal = 0;

    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const val = Math.abs(B_curr[i][j]);
        if (val > maxVal) {
          maxVal = val;
          p = i;
          q = j;
        }
      }
    }

    if (maxVal < 1e-12) {
      steps.push(`Jacobi convergence reached at iteration ${iter}. Off-diagonals are near 0.`);
      break;
    }

    // Compute rotation angle theta
    const B_pp = B_curr[p][p];
    const B_qq = B_curr[q][q];
    const B_pq = B_curr[p][q];

    const tau = (B_qq - B_pp) / (2 * B_pq);
    const t = (tau >= 0 ? 1 : -1) / (Math.abs(tau) + Math.sqrt(1 + tau * tau));
    const c = 1 / Math.sqrt(1 + t * t);
    const s = c * t;

    // Rotate matrix B_curr: B <- J^T * B * J
    B_curr[p][p] = c * c * B_pp - 2 * c * s * B_pq + s * s * B_qq;
    B_curr[q][q] = s * s * B_pp + 2 * c * s * B_pq + c * c * B_qq;
    B_curr[p][q] = 0;
    B_curr[q][p] = 0;

    for (let i = 0; i < n; i++) {
      if (i !== p && i !== q) {
        const B_ip = B_curr[i][p];
        const B_iq = B_curr[i][q];
        
        B_curr[i][p] = c * B_ip - s * B_iq;
        B_curr[p][i] = B_curr[i][p];
        
        B_curr[i][q] = s * B_ip + c * B_iq;
        B_curr[q][i] = B_curr[i][q];
      }
    }

    // Accumulate eigenvectors in V: V <- V * J
    for (let i = 0; i < n; i++) {
      const V_ip = V[i][p];
      const V_iq = V[i][q];
      V[i][p] = c * V_ip - s * V_iq;
      V[i][q] = s * V_ip + c * V_iq;
    }
  }

  const eigenvalues = B_curr.map((row, i) => row[i]);
  return { eigenvalues, eigenvectors: V, steps };
}

export function svd(A: Matrix): SVDResult {
  const n = A.length;
  if (n !== A[0].length) throw new Error("SVD is currently implemented for square matrices");
  
  const steps: string[] = [];
  steps.push("Computing Singular Value Decomposition (SVD): A = U * S * V^T...");
  
  // Step 1: B = A^T * A
  steps.push("Step 1: Compute symmetric matrix B = A^T * A...");
  const AT = transpose(A);
  const B = multiply(AT, A);
  
  // Step 2: Eigenvalues & Eigenvectors of B
  steps.push("Step 2: Solve eigenvalues & eigenvectors of B using Jacobi rotation...");
  const jacobi = jacobiEigen(B, 120);
  steps.push(...jacobi.steps);
  
  const eigenvals = jacobi.eigenvalues;
  const V = jacobi.eigenvectors; // columns of V are eigenvectors of B
  
  // Step 3: Compute singular values and sort
  steps.push("Step 3: Extract singular values (sqrt of eigenvalues) and sort descending...");
  const indices = Array.from({ length: n }, (_, i) => i);
  indices.sort((a, b) => eigenvals[b] - eigenvals[a]); // Sort descending
  
  const S: number[] = [];
  const sortedV = createZeroMatrix(n, n);
  
  indices.forEach((sortedIdx, newIdx) => {
    const rawEigen = eigenvals[sortedIdx];
    const singVal = Math.sqrt(Math.max(0, rawEigen));
    S.push(singVal);
    
    // Sort columns of V
    for (let r = 0; r < n; r++) {
      sortedV[r][newIdx] = V[r][sortedIdx];
    }
    steps.push(`Singular value s_${newIdx+1} = ${singVal.toFixed(6)} (derived from eigenvalue ${rawEigen.toFixed(6)})`);
  });
  
  // Step 4: Compute U = A * V * S^-1
  steps.push("Step 4: Compute left singular vectors U: u_i = (1 / s_i) * A * v_i...");
  const U = createZeroMatrix(n, n);
  
  for (let c = 0; c < n; c++) {
    const singVal = S[c];
    if (singVal > 1e-9) {
      for (let r = 0; r < n; r++) {
        let sum = 0;
        for (let k = 0; k < n; k++) {
          sum += A[r][k] * sortedV[k][c];
        }
        U[r][c] = sum / singVal;
      }
    } else {
      steps.push(`Singular value s_${c+1} is near 0. Will resolve vector using Gram-Schmidt null space projection.`);
    }
  }
  
  // Gram-Schmidt to orthonormalize U columns (specifically for rank-deficient matrices)
  for (let c = 0; c < n; c++) {
    let isZeroCol = true;
    for (let r = 0; r < n; r++) {
      if (Math.abs(U[r][c]) > 1e-8) {
        isZeroCol = false;
        break;
      }
    }
    
    if (isZeroCol) {
      const v = Array(n).fill(0);
      v[c] = 1; 
      
      for (let prev = 0; prev < c; prev++) {
        let dot = 0;
        for (let r = 0; r < n; r++) dot += U[r][prev] * v[r];
        for (let r = 0; r < n; r++) v[r] -= dot * U[r][prev];
      }
      
      let norm = 0;
      for (let r = 0; r < n; r++) norm += v[r] * v[r];
      norm = Math.sqrt(norm);
      if (norm > 1e-9) {
        for (let r = 0; r < n; r++) U[r][c] = v[r] / norm;
      }
    }
  }
  
  steps.push("SVD computation completed successfully.");
  return { U, S, VT: transpose(sortedV), steps };
}

export interface MultivariateStats {
  means: number[];
  stdevs: number[];
  covariance: Matrix;
  correlation: Matrix;
  steps: string[];
}

export function computeMultivariateStats(A: Matrix): MultivariateStats {
  const rows = A.length; // samples
  const cols = A[0].length; // variables
  const steps: string[] = [];

  steps.push(`Computing Multivariate Statistics for ${rows} samples and ${cols} variables...`);

  // 1. Means
  const means: number[] = Array(cols).fill(0);
  for (let c = 0; c < cols; c++) {
    let sum = 0;
    for (let r = 0; r < rows; r++) sum += A[r][c];
    means[c] = sum / rows;
  }
  steps.push(`Step 1: Computed variable means: [${means.map(m => m.toFixed(4)).join(", ")}]`);

  // 2. Standard Deviations
  const stdevs: number[] = Array(cols).fill(0);
  for (let c = 0; c < cols; c++) {
    let sumSq = 0;
    for (let r = 0; r < rows; r++) {
      const diff = A[r][c] - means[c];
      sumSq += diff * diff;
    }
    const divisor = rows > 1 ? rows - 1 : 1;
    stdevs[c] = Math.sqrt(sumSq / divisor);
  }
  steps.push(`Step 2: Computed sample standard deviations: [${stdevs.map(s => s.toFixed(4)).join(", ")}]`);

  // 3. Covariance Matrix
  const covariance = createZeroMatrix(cols, cols);
  for (let i = 0; i < cols; i++) {
    for (let j = i; j < cols; j++) {
      let sumCov = 0;
      for (let r = 0; r < rows; r++) {
        sumCov += (A[r][i] - means[i]) * (A[r][j] - means[j]);
      }
      const divisor = rows > 1 ? rows - 1 : 1;
      const covVal = sumCov / divisor;
      covariance[i][j] = covVal;
      covariance[j][i] = covVal;
    }
  }
  steps.push("Step 3: Solved sample covariance matrix.");

  // 4. Correlation Matrix
  const correlation = createZeroMatrix(cols, cols);
  for (let i = 0; i < cols; i++) {
    for (let j = i; j < cols; j++) {
      if (i === j) {
        correlation[i][j] = 1.0;
      } else {
        const denom = stdevs[i] * stdevs[j];
        const corrVal = denom > 1e-9 ? covariance[i][j] / denom : 0;
        correlation[i][j] = corrVal;
        correlation[j][i] = corrVal;
      }
    }
  }
  steps.push("Step 4: Solved Pearson correlation matrix.");

  return { means, stdevs, covariance, correlation, steps };
}
