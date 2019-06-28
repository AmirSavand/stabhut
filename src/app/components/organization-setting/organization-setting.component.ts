import { Component, OnInit } from '@angular/core';
import { UIRouter } from '@uirouter/core';
import { Column } from '../../models/column';
import { Organization } from '../../models/organization';
import { Project } from '../../models/project';
import { ApiService } from '../../services/api/api.service';

@Component({
  selector: 'app-column',
  templateUrl: './organization-setting.component.html',
  styleUrls: ['./organization-setting.component.scss']
})
export class OrganizationSettingComponent implements OnInit {

  /**
   * Organization ID from route
   */
  organizationId: number;

  /**
   * Current organization data
   */
  organization: Organization;

  /**
   * Projects of organization
   */
  projects: Project[];

  /**
   * Selected project
   */
  projectSelected: Project;

  /**
   * Selected project tab template variable ('columns' or 'options')
   */
  projectTab = 'columns';

  constructor(private router: UIRouter,
              private apiService: ApiService) {
  }

  ngOnInit(): void {
    // Get current project ID from router params
    this.organizationId = parseInt(this.router.globals.params.id, 0);
    // Load organisation data
    this.apiService.getOrganization(this.organizationId).subscribe(organization => {
      this.organization = organization;
    });
    // Load projects of organization
    this.apiService.getProjects(this.organizationId).subscribe(projects => {
      this.projects = projects;
      this.projectSelected = this.projects[0];
      // Load columns of organization
      this.apiService.getColumns(this.organizationId).subscribe(columns => {
        // Assign columns to their projects
        for (const project of this.projects) {
          project.columns = columns.filter(column => column.project === project.id);
        }
      });
    });
  }

  /**
   * Add a project
   *
   * @param name Project name
   */
  addProject(name: string) {
    this.apiService.createProject(this.organization.id, name).subscribe(data => {
      data.columns = [];
      this.projects.push(data);
    });
  }

  /**
   * Add a column
   *
   * @param name Column name
   */
  addColumn(name: string): void {
    this.apiService.createColumn(this.projectSelected.id, name).subscribe(data => {
      this.projectSelected.columns.push(data);
    });
  }

  /**
   * Delete a column
   *
   * @param column Column to delete
   */
  deleteColumn(column: Column): void {
    if (!confirm('Are you sure you want to delete this column?')) {
      return;
    }
    this.apiService.deleteColumn(column.id).subscribe(() => {
      const index = this.projectSelected.columns.indexOf(column);
      this.projectSelected.columns.splice(index, 1);
    });
  }

  /**
   * Update all columns
   */
  updateColumns() {
    for (let column of this.projectSelected.columns) {
      this.apiService.updateColumn(column.id, { name: column.name }).subscribe(data => {
        column = data;
      });
    }
  }
}