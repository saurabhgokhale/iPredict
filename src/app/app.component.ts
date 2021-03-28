import { Component, OnInit } from '@angular/core';
import { v4 as uuidv4 } from 'uuid';
import { interval } from 'rxjs';
import { ElasticsearchService } from './elasticsearch-service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  title = 'iPredict';
  uuid = '';
  returnObj = [];
  

  constructor(private es: ElasticsearchService){
    interval(2000).subscribe(x => {
        this.uuid = uuidv4();
        //console.log(this.uuid); 
        this.es.getAllSolutions()
        .then(response => {
          console.log(response);
          this.returnObj = response;
        }, error => {
          console.error(error);
        }).then(() => {
          console.log('Show Product Completed!');
        });
        /*
        this.es.getAllProducts('opes', 'phone')
          .then(response => {
            //this.productSources = response.hits.hits;
            this.returnObj = response.hits.hits;
            console.log(this.returnObj[0]._source.search_data[0].full_text);
          }, error => {
            console.error(error);
          }).then(() => {
            console.log('Show Product Completed!');
          });
          */
      });
 }
  ngOnInit(): void {
    this.es.getAllProducts('opes', 'phone')
      .then(response => {
        //this.productSources = response.hits.hits;
        this.returnObj = response.hits.hits;
        //console.log(this.returnObj[0]._source.search_data[0].full_text);
      }, error => {
        console.error(error);
      }).then(() => {
        console.log('Show Product Completed!');
      });
  }

  getBgColor(val): any {
    return 'green';
  }

  getColor(val): any {
    return 'white';
  }
  
}
