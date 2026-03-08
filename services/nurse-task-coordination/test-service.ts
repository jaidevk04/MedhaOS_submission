/**
 * Test script for Nurse Task Coordination System
 * 
 * Demonstrates:
 * - Nurse registration
 * - Task creation and assignment
 * - Workload monitoring
 * - Automatic task redistribution
 * - Alert generation and escalation
 */

import { NurseCoordinationService } from './src/services/nurse-coordination.service';
import { TaskType, TaskPriority, NurseStatus } from './src/types';

async function runTests() {
  console.log('🏥 Nurse Task Coordination System - Test Suite\n');
  console.log('='.repeat(60));

  const service = new NurseCoordinationService();

  // Test 1: Register Nurses
  console.log('\n📋 Test 1: Registering Nurses');
  console.log('-'.repeat(60));

  const nurses = [
    {
      nurseId: 'nurse-001',
      name: 'Sarah Johnson',
      skillLevel: 'SENIOR' as const,
      status: NurseStatus.AVAILABLE,
      currentWorkload: 0,
      assignedPatients: [],
      shiftStart: new Date('2024-01-01T08:00:00Z'),
      shiftEnd: new Date('2024-01-01T20:00:00Z'),
    },
    {
      nurseId: 'nurse-002',
      name: 'Michael Chen',
      skillLevel: 'INTERMEDIATE' as const,
      status: NurseStatus.AVAILABLE,
      currentWorkload: 0,
      assignedPatients: [],
      shiftStart: new Date('2024-01-01T08:00:00Z'),
      shiftEnd: new Date('2024-01-01T20:00:00Z'),
    },
    {
      nurseId: 'nurse-003',
      name: 'Emily Rodriguez',
      skillLevel: 'JUNIOR' as const,
      status: NurseStatus.AVAILABLE,
      currentWorkload: 0,
      assignedPatients: [],
      shiftStart: new Date('2024-01-01T08:00:00Z'),
      shiftEnd: new Date('2024-01-01T20:00:00Z'),
    },
    {
      nurseId: 'nurse-004',
      name: 'Dr. Patricia Williams',
      skillLevel: 'CHARGE' as const,
      status: NurseStatus.AVAILABLE,
      currentWorkload: 0,
      assignedPatients: [],
      shiftStart: new Date('2024-01-01T08:00:00Z'),
      shiftEnd: new Date('2024-01-01T20:00:00Z'),
    },
  ];

  nurses.forEach((nurse) => {
    service.registerNurse(nurse);
    console.log(`✅ Registered: ${nurse.name} (${nurse.skillLevel})`);
  });

  // Test 2: Create and Assign Tasks
  console.log('\n📋 Test 2: Creating and Assigning Tasks');
  console.log('-'.repeat(60));

  const tasks = [
    {
      patientId: 'patient-001',
      patientName: 'John Smith',
      patientRoom: 'ICU-201',
      taskType: TaskType.MEDICATION_ADMINISTRATION,
      priority: TaskPriority.URGENT,
      description: 'Administer insulin 10 units',
      estimatedDurationMinutes: 15,
      dueTime: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes from now
      requiresBarcodeScan: true,
      medicationDetails: {
        medicationName: 'Insulin',
        dosage: '10 units',
        route: 'subcutaneous',
        barcode: '12345678',
      },
    },
    {
      patientId: 'patient-002',
      patientName: 'Mary Johnson',
      patientRoom: 'Ward-305',
      taskType: TaskType.VITAL_SIGNS_CHECK,
      priority: TaskPriority.ROUTINE,
      description: 'Check vital signs',
      estimatedDurationMinutes: 10,
    },
    {
      patientId: 'patient-003',
      patientName: 'Robert Davis',
      patientRoom: 'ED-101',
      taskType: TaskType.EMERGENCY_RESPONSE,
      priority: TaskPriority.CRITICAL,
      description: 'Stabilize patient - chest pain',
      estimatedDurationMinutes: 30,
      dueTime: new Date(Date.now() + 5 * 60 * 1000), // 5 minutes from now
    },
  ];

  for (const taskData of tasks) {
    const result = await service.createAndAssignTask(taskData);
    console.log(
      `✅ Task created: ${taskData.description} (Priority: ${taskData.priority})`
    );
    if (result.assignment) {
      const nurse = service.getNurse(result.assignment.nurseId);
      console.log(`   → Assigned to: ${nurse?.name}`);
      console.log(`   → Reason: ${result.assignment.reason}`);
      console.log(`   → Priority Score: ${result.task.priorityScore}`);
    }
  }

  // Test 3: View Workload Metrics
  console.log('\n📊 Test 3: Workload Metrics');
  console.log('-'.repeat(60));

  const metrics = service.getAllWorkloadMetrics();
  metrics.forEach((metric) => {
    console.log(`\n${metric.nurseName}:`);
    console.log(`  Current Tasks: ${metric.currentTasks}`);
    console.log(`  Workload Score: ${metric.workloadScore}/100`);
    console.log(`  Status: ${metric.isOverloaded ? '⚠️  OVERLOADED' : '✅ Normal'}`);
  });

  // Test 4: Simulate Overload Scenario
  console.log('\n⚠️  Test 4: Simulating Overload Scenario');
  console.log('-'.repeat(60));

  // Assign multiple tasks to one nurse to trigger overload
  const overloadTasks = [
    {
      patientId: 'patient-004',
      patientName: 'Alice Brown',
      patientRoom: 'Ward-401',
      taskType: TaskType.WOUND_CARE,
      priority: TaskPriority.ROUTINE,
      description: 'Change wound dressing',
      estimatedDurationMinutes: 20,
    },
    {
      patientId: 'patient-005',
      patientName: 'Bob Wilson',
      patientRoom: 'Ward-402',
      taskType: TaskType.IV_MANAGEMENT,
      priority: TaskPriority.ROUTINE,
      description: 'Check IV line',
      estimatedDurationMinutes: 10,
    },
    {
      patientId: 'patient-006',
      patientName: 'Carol Martinez',
      patientRoom: 'Ward-403',
      taskType: TaskType.PATIENT_ASSESSMENT,
      priority: TaskPriority.ROUTINE,
      description: 'Patient assessment',
      estimatedDurationMinutes: 15,
    },
    {
      patientId: 'patient-007',
      patientName: 'David Lee',
      patientRoom: 'Ward-404',
      taskType: TaskType.MEDICATION_ADMINISTRATION,
      priority: TaskPriority.URGENT,
      description: 'Administer antibiotics',
      estimatedDurationMinutes: 15,
    },
    {
      patientId: 'patient-008',
      patientName: 'Eva Garcia',
      patientRoom: 'Ward-405',
      taskType: TaskType.SPECIMEN_COLLECTION,
      priority: TaskPriority.ROUTINE,
      description: 'Collect blood sample',
      estimatedDurationMinutes: 10,
    },
  ];

  for (const taskData of overloadTasks) {
    await service.createAndAssignTask(taskData);
  }

  console.log('✅ Created 5 additional tasks');

  // Start monitoring to trigger alerts
  console.log('\n🔍 Starting workload monitoring...');
  service.startMonitoring(1); // Monitor every 1 second for demo

  // Wait for monitoring to detect overload
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // Test 5: Check Alerts
  console.log('\n🚨 Test 5: Active Alerts');
  console.log('-'.repeat(60));

  const alerts = service.getActiveAlerts();
  if (alerts.length > 0) {
    alerts.forEach((alert) => {
      console.log(`\n${alert.severity} Alert:`);
      console.log(`  Nurse: ${alert.nurseName}`);
      console.log(`  Workload: ${alert.currentWorkload} tasks (threshold: ${alert.threshold})`);
      console.log(`  Escalated: ${alert.escalatedToChargeNurse ? 'Yes' : 'No'}`);
      console.log(`  Time: ${alert.timestamp.toISOString()}`);
    });
  } else {
    console.log('No active alerts');
  }

  // Test 6: High-Acuity Patient Assignment
  console.log('\n🏥 Test 6: High-Acuity Patient Assignment');
  console.log('-'.repeat(60));

  const highAcuityTasks = [
    {
      patientId: 'patient-999',
      patientName: 'Critical Patient',
      patientRoom: 'ICU-101',
      taskType: TaskType.EMERGENCY_RESPONSE,
      priority: TaskPriority.CRITICAL,
      description: 'Monitor critical patient',
      estimatedDurationMinutes: 60,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      patientId: 'patient-999',
      patientName: 'Critical Patient',
      patientRoom: 'ICU-101',
      taskType: TaskType.MEDICATION_ADMINISTRATION,
      priority: TaskPriority.CRITICAL,
      description: 'Administer emergency medication',
      estimatedDurationMinutes: 15,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  const assignments = await service.assignHighAcuityPatient(
    'patient-999',
    highAcuityTasks as any
  );

  console.log(`✅ Assigned ${assignments.length} tasks for high-acuity patient`);
  if (assignments.length > 0) {
    const nurse = service.getNurse(assignments[0].nurseId);
    console.log(`   → Assigned to: ${nurse?.name} (${nurse?.skillLevel})`);
    console.log(`   → Reason: ${assignments[0].reason}`);
  }

  // Test 7: Task Completion
  console.log('\n✅ Test 7: Task Completion');
  console.log('-'.repeat(60));

  const allTasks = service.getAllTasks();
  if (allTasks.length > 0) {
    const taskToComplete = allTasks[0];
    console.log(`Completing task: ${taskToComplete.description}`);
    
    const updatedTask = service.updateTaskStatus(taskToComplete.taskId, 'COMPLETED' as any);
    if (updatedTask) {
      console.log(`✅ Task completed at: ${updatedTask.completedAt?.toISOString()}`);
      
      if (updatedTask.assignedNurseId) {
        const nurse = service.getNurse(updatedTask.assignedNurseId);
        console.log(`   → Nurse workload reduced to: ${nurse?.currentWorkload} tasks`);
      }
    }
  }

  // Test 8: Summary
  console.log('\n📊 Test 8: System Summary');
  console.log('-'.repeat(60));

  const allNurses = service.getAllNurses();
  const allTasksList = service.getAllTasks();
  const activeAlerts = service.getActiveAlerts();

  console.log(`\nTotal Nurses: ${allNurses.length}`);
  console.log(`Total Tasks: ${allTasksList.length}`);
  console.log(`Active Alerts: ${activeAlerts.length}`);

  console.log('\nNurse Workload Distribution:');
  allNurses.forEach((nurse) => {
    const tasks = service.getTasksForNurse(nurse.nurseId);
    console.log(`  ${nurse.name}: ${tasks.length} tasks`);
  });

  // Stop monitoring
  service.stopMonitoring();

  console.log('\n' + '='.repeat(60));
  console.log('✅ All tests completed successfully!');
  console.log('='.repeat(60) + '\n');
}

// Run tests
runTests().catch((error) => {
  console.error('❌ Test failed:', error);
  process.exit(1);
});
